import { WebSocket } from "@clusterws/cws";
import { v4 as uuid } from "uuid";
import { FileWriter } from "wav";
import { random } from "lodash";

const SOCKETS: {
    [id: string]: SocketWrapper,
} = {};

const USER_NAMES: {
    [id: string]: string,
} = {};

const SINKS: {
    [id: string]: {
        owner: string,
        buffer: Buffer,
    },
} = {};

type RoomMember = {
    type: "USER" | "SINK",
    pos: {
        x: number,
        y: number,
    }
};

const ROOMS: {
    [id: string]: {
        name: string,
        members: { [id: string]: RoomMember }
    }
} = {};
const MESSAGE_SEPARATOR = "$/$";

type SocketWrapper = WebSocket & { id: string };

export function connectSocket(socket: WebSocket) {
    const wrapped: SocketWrapper = Object.assign(socket, { id: uuid() });
    SOCKETS[wrapped.id] = wrapped;
    wrapped.on("message", message => {
        if (typeof message === 'string') {
            handleStringMessage(wrapped, message);
        } else if (message instanceof ArrayBuffer) {
            handleDataMessage(wrapped, message);
        }
    });
}

function handleStringMessage(socket: SocketWrapper, message: string) {
    const { action, data } = parseStringMessage(message);
    const success = `${action}.SUCCESS`;
    const failure = `${action}.FAILURE`;
    switch (action) {
        case "ME": {
            return sendStringMessage(socket, success, socket.id);
        }
        case "NAME.SET":
            USER_NAMES[socket.id] = data;
            return sendStringMessage(socket, success);
        case "ROOM.JOIN": {
            const room = ROOMS[data];
            const otherRoom = Object.values(ROOMS).find(r => r.members[socket.id]);
            if (!room || otherRoom) {
                return sendStringMessage(socket, failure);
            }
            const newEntry: RoomMember = {
                type: "USER",
                pos: {
                    x: random(0, 100),
                    y: random(0, 100),
                }
            };
            const entryToSend = JSON.stringify({
                ...newEntry,
                name: USER_NAMES[socket.id],
                id: socket.id,
            });
            Object.keys(room.members).forEach(id => {
                const other = SOCKETS[id];
                if (other?.readyState === WebSocket.OPEN) {
                    sendStringMessage(other, "ROOM.NEWMEMBER", entryToSend);
                }
            });
            room.members[socket.id] = newEntry;
            return sendStringMessage(socket, success, data);
        }
        case "ROOM.NEW": {
            const otherRoom = Object.values(ROOMS).find(r => r.members[socket.id]);
            if (otherRoom) {
                return sendStringMessage(socket, failure)
            }
            const roomID = uuid();
            ROOMS[roomID] = {
                name: data,
                members: {
                    [socket.id]: {
                        type: "USER",
                        pos: {
                            x: random(0, 100),
                            y: random(0, 100),
                        }
                    }
                }
            }
            return sendStringMessage(socket, success, roomID);
        }
        case "ROOM.LISTMEMBERS": {
            const room = Object.values(ROOMS).find(r => r.members[socket.id]);
            if (!room) {
                return sendStringMessage(socket, failure);
            }
            const byId: { [id: string]: RoomMember & { name?: string, owner?: string } } = {};
            Object.entries(room.members).forEach(([id, member]) => {
                byId[id] = {
                    ...member,
                    name: USER_NAMES[id],
                    ...SINKS[id],
                }
            })
            return sendStringMessage(socket, success, JSON.stringify(byId));
        }
        case "ROOM.LIST": {
            const byId: { [id: string]: string } = {};
            Object.entries(ROOMS).forEach(([id, room]) => {
                byId[id] = room.name;
            })
            return sendStringMessage(socket, success, JSON.stringify(byId));
        }
        case "ROOM.LEAVE": {
            const room = Object.values(ROOMS).find(room => room.members[socket.id]);
            if (room) {
                delete room.members[socket.id];
                const sinks = Object.entries(room.members)
                    .filter(([id, member]) => member.type === "SINK" && SINKS[id]?.owner === socket.id)
                    .map(([id]) => id);
                sinks.forEach(sinkID => {
                    delete SINKS[sinkID];
                    delete room.members[sinkID];
                });
                Object.entries(room.members).filter(([id, member]) =>
                    member.type === "USER" && SOCKETS[id]?.readyState === WebSocket.OPEN).forEach(([id]) => {
                        sendStringMessage(SOCKETS[id], "ROOM.LEAVE.MEMBERS", socket.id, ...sinks);
                    });
            }
            return sendStringMessage(socket, success);
        }
        case "ROOM.MOVE": {
            const [id, sx, sy] = data.split(MESSAGE_SEPARATOR);
            const x = parseInt(sx);
            const y = parseInt(sy);
            const room = Object.values(ROOMS).find(room => room.members[id]);
            if (!room) {
                return sendStringMessage(socket, failure);
            }
            room.members[id].pos = { x, y };
            Object.entries(room.members).filter(([oid, member]) =>
                member.type === "USER" && SOCKETS[oid]?.readyState === WebSocket.OPEN
            ).forEach(([oid]) => {
                sendStringMessage(SOCKETS[oid], "ROOM.MEMBER.MOVE", id, sx, sy);
            });
            return sendStringMessage(socket, success);
        }
        case "ROOM.SINK.NEW": {
            const room = Object.values(ROOMS).find(room => room.members[socket.id]);
            if (!room) {
                return sendStringMessage(socket, failure);
            }
            const sinkID = uuid();
            const buffer = Buffer.from([]);
            SINKS[sinkID] = {
                owner: socket.id,
                buffer,
            };
            const member: RoomMember = {
                type: "SINK",
                pos: {
                    x: random(0, 100),
                    y: random(0, 100),
                }
            };
            const entryToSend = JSON.stringify({
                ...member,
                owner: socket.id,
                id: sinkID,
            });
            Object.keys(room.members).forEach(id => {
                const other = SOCKETS[id];
                if (other?.readyState === WebSocket.OPEN) {
                    sendStringMessage(other, "ROOM.NEWMEMBER", entryToSend);
                }
            });
            room.members[sinkID] = member;
            return sendStringMessage(socket, success, data);
        }
        case "ROOM.SINK.PLAY": {
            const sink = SINKS[data];
            const room = Object.values(ROOMS).find(room => room.members[data]);
            if (!sink || !room) {
                return sendStringMessage(socket, failure);
            }
            for (let ix = 0; ix < sink.buffer.length; ix += 2048) {
                const buffer = sink.buffer.subarray(ix, ix + 2048);
                sendAudio(room.members, buffer, data);
            }
            sink.buffer = Buffer.from([]);
            return sendStringMessage(socket, success);
        }

    }
}
function sendStringMessage(socket: SocketWrapper, action: string, ...parts: string[]) {
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

function handleDataMessage(socket: SocketWrapper, message: ArrayBuffer) {
    const room = Object.values(ROOMS).find(room => room.members[socket.id]);
    if (!room) {
        console.error("No Room");
        return;
    }
    sendAudio(room.members, message, socket.id);
    // TODO: instead of saving to file, write to every socket in the user's room
    // user.wav = user.wav || new FileWriter("temp.wav", {
    //     channels: 1,
    //     sampleRate: 44100,
    //     bitDepth: 16,
    // });
    // user.wav.write(Buffer.from(message));
}

function sendAudio(members: { [id: string]: RoomMember }, data: ArrayBuffer, sourceID: string) {
    // TODO process relative position
    const buffer = Buffer.from(data);
    const sourcePos = members[sourceID].pos;
    Object.entries(members).forEach(([id, member]) => {
        if (id === sourceID) {
            return;
        }
        switch (member.type) {
            case "USER": {
                const socket = SOCKETS[id];
                if (socket?.readyState === WebSocket.OPEN) {
                    socket.send(buffer);
                }
                return;
            }
            case "SINK": {
                const sink = SINKS[id];
                if (sink) {
                    sink.buffer = Buffer.concat([sink.buffer, buffer]);
                }
                return;
            }
        }
    })
}