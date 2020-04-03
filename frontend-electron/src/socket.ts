const PING_CHAR = 57;
const PONG = new Uint8Array([65]);

const MESSAGE_SEPARATOR = "$/$";

type BaseRoomMember = {
    pos: {
        x: number,
        y: number,
    }
};

export type RoomUser = BaseRoomMember & {
    type: "USER",
    name: string,
};

export type RoomSink = BaseRoomMember & {
    type: "SINK",
    owner: string,
}

export type RoomMember = RoomSink | RoomUser;

function isPing(data: any) {
    if (!(data instanceof ArrayBuffer)) {
        return false;
    }
    const buffer = new Uint8Array(data);
    return buffer.length === 1 && buffer[0] === PING_CHAR;
}

export default class Socket {
    private _id: string = "PLACEHOLDER";
    private readonly _listeners: { [fn: string]: ((data: string) => void)[] } = {};
    private _audioListener: ((pos: { x: number, y: number }, data: Int16Array) => void) | null = null;

    get id(): string {
        return this._id;
    }

    static async init(): Promise<Socket> {
        const socket = new WebSocket(process.env.BACKEND_SERVER_URL!);
        const instance = new Socket(socket);
        await new Promise((resolve, reject) => {
            socket.onopen = resolve;
            socket.onerror = reject;
            socket.binaryType = 'arraybuffer';
            socket.onmessage = instance.handleMessage.bind(instance);
        });
        instance._id = await instance.getStringResponse("ME");
        console.info("Socket connected");
        return instance;
    }

    constructor(private readonly socket: WebSocket) { }

    protected addListener(key: string, callback: (data: string) => void) {
        this._listeners[key] = this._listeners[key] || [];
        this._listeners[key].push(callback);
    }


    protected removeListener(key: string, callback: (data: string) => void) {
        this._listeners[key] = this._listeners[key] || [];
        const index = this._listeners[key].indexOf(callback);
        if (index >= 0) {
            this._listeners[key].splice(index, 1);
        }
    }

    protected attachCallback(key: string, cb: (data: string) => void): () => void {
        this.addListener(key, cb);
        return () => this.removeListener(key, cb);
    }

    private async handleMessage(message: MessageEvent): Promise<void> {
        if (isPing(message.data)) {
            console.info("PING");
            this.socket.send(PONG);
            return;
        } else if (typeof message.data === 'string') {
            const { action, data } = parseStringMessage(message.data);
            if (this._listeners[action]) {
                this._listeners[action].forEach(cb => cb(data));
            }
        } else {
            this.receiveAudio(new Int16Array(message.data as ArrayBuffer));
        }
    }

    private async getStringResponse(key: string, ...data: string[]): Promise<string> {
        sendStringMessage(this.socket, key, ...data);
        return await new Promise((res, rej) => {
            function successListener(data: string) {
                res(data);
                removeListeners();
            }
            function failureListener(data: string) {
                rej(data);
                removeListeners();
            }
            const self = this;
            function removeListeners() {
                self.removeListener(`${key}.SUCCESS`, successListener);
                self.removeListener(`${key}.FAILURE`, failureListener);
            }
            this.addListener(`${key}.SUCCESS`, successListener);
            this.addListener(`${key}.FAILURE`, failureListener);

        });
    }

    async setUserName(name: string): Promise<void> {
        await this.getStringResponse("NAME.SET", name);
    }

    async listRooms(): Promise<{ [id: string]: string }> {
        const data = await this.getStringResponse("ROOM.LIST");
        return JSON.parse(data);
    }

    async listRoomMembers(): Promise<{ [id: string]: RoomMember }> {
        const data = await this.getStringResponse("ROOM.LISTMEMBERS");
        return JSON.parse(data);
    }

    async updatePosition(data: { id: string, pos: { x: number, y: number } }): Promise<void> {
        await this.getStringResponse(
            "ROOM.MOVE",
            data.id,
            String(data.pos.x),
            String(data.pos.y)
        );
    }

    async joinRoom(roomID: string): Promise<void> {
        await this.getStringResponse("ROOM.JOIN", roomID);
    }

    async leaveRoom(): Promise<void> {
        await this.getStringResponse("ROOM.LEAVE");
    }

    async createRoom(name: string): Promise<string> {
        return await this.getStringResponse("ROOM.NEW", name);
    }

    async createSink(): Promise<void> {
        await this.getStringResponse("ROOM.SINK.NEW");
    }

    async playSink(sink: string): Promise<void> {
        await this.getStringResponse("ROOM.SINK.PLAY", sink);
    }

    onAddMember(callback: (member: RoomMember & { id: string }) => void) {
        return this.attachCallback("ROOM.NEWMEMBER", (data: string) => {
            callback(JSON.parse(data));
        });
    }

    onRemoveMembers(callback: (ids: string[]) => void) {
        return this.attachCallback("ROOM.LEAVE.MEMBERS", (data: string) => {
            const members = data.split(MESSAGE_SEPARATOR);
            return callback(members);
        });
    }

    onMoveMember(callback: (data: { id: string, pos: { x: number, y: number } }) => void) {
        return this.attachCallback("ROOM.MEMBER.MOVE", data => {
            const [id, x, y] = data.split(MESSAGE_SEPARATOR);
            return callback({
                id,
                pos: {
                    x: parseInt(x),
                    y: parseInt(y),
                }
            });
        });
    }

    onAudio(output: (pos: { x: number, y: number }, data: Int16Array) => void): () => void {
        this._audioListener = output;
        return () => { this._audioListener = null; }
    }

    sendAudio(buffer: Int16Array) {
        this.socket.send(buffer);
    }

    receiveAudio(buffer: Int16Array) {
        const [x, y] = buffer.slice(-2);
        const audio = buffer.subarray(0, -2);
        if (this._audioListener) {
            this._audioListener({ x, y }, audio);
        }
    }

    close() {
        this.socket.close();
    }
}

function sendStringMessage(socket: WebSocket, action: string, ...parts: string[]) {
    socket.send([action, ...parts].join(MESSAGE_SEPARATOR))
}

function parseStringMessage(message: string) {
    const [
        action,
        ...data
    ] = message.split(MESSAGE_SEPARATOR);
    return {
        action,
        data: data.join(MESSAGE_SEPARATOR),
    }
}
