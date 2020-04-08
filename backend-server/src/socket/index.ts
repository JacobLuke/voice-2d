import { WebSocket } from "@clusterws/cws";
import { v4 as uuid } from "uuid";
import { random } from "lodash";

const SOCKETS: {
    [id: string]: SocketWrapper,
} = {};

const USER_NAMES: {
    [id: string]: string,
} = {};

type RoomMember = {
    pos: {
        x: number,
        y: number,
    },
} & ({
    type: "USER",
    track?: string,
} | {
    type: "SINK",
    owner: string,
})

type RoomMemberWithoutConnection = Omit<RoomMember, "connection">

const ROOMS: {
    [id: string]: {
        name: string,
        members: { [id: string]: RoomMember },
    }
} = {};
const MESSAGE_SEPARATOR = "$/$";

type SocketWrapper = WebSocket & { id: string };

export function connectSocket(socket: WebSocket) {
    const wrapped: SocketWrapper = Object.assign(socket, { id: uuid() });
    SOCKETS[wrapped.id] = wrapped;
    wrapped.on("message", async message => {
        if (typeof message === 'string') {
            await handleStringMessage(wrapped, message);
        }
    });
    wrapped.onclose = () => {
        const roomEntry = Object.entries(ROOMS).find(entry => entry[1].members[wrapped.id]);
        if (roomEntry) {
            // TODO refactor this to share with "ROOM.LEAVE"
            const [roomID, room] = roomEntry;
            delete room.members[wrapped.id];
            const sinks: string[] = [];
            Object.entries(room.members)
                .forEach(([id, member]) => {
                    if (member.type === "SINK" && member.owner === wrapped.id) {
                        delete room.members[id];
                        sinks.push(id);
                    }
                });
            Object.entries(room.members).filter(([id, member]) =>
                member.type === "USER" && SOCKETS[id]?.readyState === WebSocket.OPEN).forEach(([id]) => {
                    sendStringMessage(SOCKETS[id], "ROOM.LEAVE.MEMBERS", wrapped.id, ...sinks);
                });
            if (!Object.keys(room.members).length) {
                Object.values(SOCKETS).forEach(otherSocket => {
                    if (otherSocket.readyState === WebSocket.OPEN) {
                        sendStringMessage(otherSocket, "ROOM.DELETE", roomID);
                    }
                });
                delete ROOMS[roomID];
            }
        }
        delete SOCKETS[wrapped.id];
    }
}

async function handleStringMessage(socket: SocketWrapper, message: string) {
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
                },
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
                // TODO: if other.connection is open, send RTCPeerConnection
            });
            room.members[socket.id] = newEntry;
            return sendStringMessage(socket, success);
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
                        },
                    }
                },
            }
            Object.values(SOCKETS).forEach(otherSocket => {
                if (otherSocket.readyState === WebSocket.OPEN) {
                    sendStringMessage(otherSocket, "ROOM.CREATE", roomID, data);
                }
            })
            return sendStringMessage(socket, success, roomID);
        }
        case "ROOM.LISTMEMBERS": {
            const room = Object.values(ROOMS).find(r => r.members[socket.id]);
            if (!room) {
                return sendStringMessage(socket, failure);
            }
            const byId: { [id: string]: RoomMemberWithoutConnection & { name?: string, owner?: string, track?: string } } = {};
            Object.entries(room.members).forEach(([id, member]) => {
                byId[id] = {
                    ...member,
                    name: USER_NAMES[id],
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
            const roomEntry = Object.entries(ROOMS).find(room => room[1].members[socket.id]);
            if (!roomEntry) {
                return sendStringMessage(socket, failure);
            }
            const [roomID, room] = roomEntry;
            delete room.members[socket.id];
            const sinks: string[] = [];
            Object.entries(room.members)
                .forEach(([id, member]) => {
                    if (member.type === "SINK" && member.owner === socket.id) {
                        delete room.members[id];
                        sinks.push(id);
                    }
                });
            Object.entries(room.members).filter(([id, member]) =>
                member.type === "USER" && SOCKETS[id]?.readyState === WebSocket.OPEN).forEach(([id]) => {
                    sendStringMessage(SOCKETS[id], "ROOM.LEAVE.MEMBERS", socket.id, ...sinks);
                });
            if (!Object.keys(room.members).length) {
                Object.values(SOCKETS).forEach(otherSocket => {
                    if (otherSocket.readyState === WebSocket.OPEN) {
                        sendStringMessage(otherSocket, "ROOM.DELETE", roomID);
                    }
                });
                delete ROOMS[roomID];
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
            const member: RoomMember = {
                type: "SINK",
                pos: {
                    x: random(0, 100),
                    y: random(0, 100),
                },
                owner: socket.id,
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
        case "ROOM.SINK.START": {
            const room = Object.values(ROOMS).find(room => room.members[data]);
            const sink = room?.members?.[data]
            if (!room || !sink || sink.type !== "SINK") {
                return sendStringMessage(socket, failure);
            }
            // sink.connection.onStartRecord();
            return sendStringMessage(socket, success);
        }
        case "ROOM.SINK.STOP": {
            const room = Object.values(ROOMS).find(room => room.members[data]);
            const sink = room?.members?.[data]
            if (!sink || sink.type !== "SINK") {
                return sendStringMessage(socket, failure);
            }
            // sink.connection.onStopRecord();
            return sendStringMessage(socket, success);
        }
        case "ROOM.SINK.PLAY": {
            const room = Object.values(ROOMS).find(room => room.members[data]);
            const sink = room?.members?.[data]
            if (!sink || sink.type !== "SINK") {
                return sendStringMessage(socket, failure);
            }
            console.log("PLAY!");
            return sendStringMessage(socket, success);
        }
        case "CONNECTION.CANDIDATE":
        case "CONNECTION.OFFER":
        case "CONNECTION.ANSWER": {
            const room = Object.values(ROOMS).find(room => room.members[socket.id]);
            const [id, ...rest] = data.split(MESSAGE_SEPARATOR);
            const other = room?.members[id];
            if (!other) {
                return sendStringMessage(socket, failure);
            }
            sendStringMessage(SOCKETS[id], action, socket.id, rest.join(MESSAGE_SEPARATOR));
            return sendStringMessage(socket, success);
        }
        default:
            return sendStringMessage(socket, failure);

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