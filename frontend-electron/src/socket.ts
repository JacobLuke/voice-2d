const PING_CHAR = 57;
const PONG = new Uint8Array([65]);

const MESSAGE_SEPARATOR = "$/$";

function isPing(data: any) {
    if (!(data instanceof ArrayBuffer)) {
        return false;
    }
    const buffer = new Uint8Array(data);
    return buffer.length === 1 && buffer[0] === PING_CHAR;
}

export default class Socket {
    private _id: string = "PLACEHOLDER";

    get id(): string {
        return this._id;
    }

    private readonly _listeners: { [fn: string]: ((data: string) => void)[] } = {};
    constructor(private readonly socket: WebSocket) { }

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
        console.log("Connected");
        return instance;
    }

    public addListener(key: string, callback: (data: string) => void) {
        this._listeners[key] = this._listeners[key] || [];
        this._listeners[key].push(callback);
    }


    public removeListener(key: string, callback: (data: string) => void) {
        this._listeners[key] = this._listeners[key] || [];
        const index = this._listeners[key].indexOf(callback);
        if (index >= 0) {
            this._listeners[key].splice(index, 1);
        }
    }

    private async handleMessage(message: MessageEvent): Promise<void> {
        if (isPing(message.data)) {
            console.log("PING RECEIVED");
            this.socket.send(PONG);
            return;
        } else if (typeof message.data === 'string') {
            const { action, data } = parseStringMessage(message.data);
            if (this._listeners[action]) {
                this._listeners[action].forEach(cb => cb(data));
            }
        } else {
            console.log(message.data);
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

    async joinRoom(roomID: string): Promise<void> {
        await this.getStringResponse("ROOM.JOIN", roomID);
    }

    async leaveRoom(): Promise<void> {
        await this.getStringResponse("ROOM.LEAVE");
    }

    async createRoom(name: string): Promise<string> {
        return await this.getStringResponse("ROOM.NEW", name);
    }

    sendAudio(buffer: Int16Array) {
        this.socket.send(buffer);
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
