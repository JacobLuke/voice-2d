import { WebSocket } from "@clusterws/cws";
import { v4 as uuid } from "uuid";

const USERS: {
    [id: string]: {
        name: string,
        socket: SocketWrapper,
        room?: string,
    }
} = {};

const ROOMS: {
    [id: string]: {
        name: string,
        users: Set<string>,
    }
} = {};
const MESSAGE_SEPARATOR = "$/$";

type SocketWrapper = WebSocket & { id: string };

export function connectSocket(socket: WebSocket) {
    const wrapped: SocketWrapper = Object.assign(socket, { id: uuid() });
    wrapped.on("message", message => {
        if (typeof message === 'string') {
            handleStringMessage(wrapped, message);
        } else {
            handleDataMessage(wrapped, message);
        }
    });
}

function handleStringMessage(socket: SocketWrapper, message: string) {
    console.log("string", message);
    const { action, data } = parseStringMessage(message);
    const success = `${action}.SUCCESS`;
    const failure = `${action}.FAILURE`;
    switch (action) {
        case "ME": {
            return sendStringMessage(socket, success, socket.id);
        }
        case "NAME.SET":
            console.log("here");
            USERS[socket.id] = {
                ...USERS[socket.id],
                name: data,
                socket,
            };
            return sendStringMessage(socket, success);
        case "ROOM.JOIN": {
            const room = ROOMS[data];
            const user = USERS[socket.id];
            if (!room || !user || user.room) {
                return sendStringMessage(socket, failure, data)
            }
            [...room.users].forEach(o => {
                const other = USERS[o];
                if (other && other.socket.readyState === WebSocket.OPEN && other.room == data) {
                    sendStringMessage(other.socket, "ROOM.NEWMEMBER", socket.id, user.name);
                }
            });
            room.users.add(socket.id);
            user.room = data;
            return sendStringMessage(socket, success, data);
        }
        case "ROOM.NEW": {
            const user = USERS[socket.id];
            if (!user || user.room) {
                return sendStringMessage(socket, failure)
            }
            const roomID = uuid();
            ROOMS[roomID] = {
                name: data,
                users: new Set([socket.id]),
            }
            return sendStringMessage(socket, success, roomID);
        }
        case "ROOM.LISTUSERS": {
            const user = USERS[socket.id];
            if (!user || !user.room || !ROOMS[user.room]) {
                return sendStringMessage(socket, failure);
            }
            const byId: { [id: string]: string } = {};
            ROOMS[user.room].users.forEach(u => {
                if (USERS[u] && USERS[u].room === user.room) {
                    byId[u] = USERS[u].name;
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
            const user = USERS[socket.id];
            if (!user) {
                return sendStringMessage(socket, failure);
            }
            const room = user.room == null ? null : ROOMS[user.room];
            if (room) {
                room.users.delete(socket.id);
            }
            user.room = undefined;
            return sendStringMessage(socket, success);
        }
        case "ROOM.SETPOS": {
            const [x, y] = data.split(";").map(i => parseInt(i));
            console.log("TODO", x, y);
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

function handleDataMessage(socket: SocketWrapper, message: any) {
    console.log("data", message, typeof message);
}