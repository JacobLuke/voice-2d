import React, { FC, useCallback, useEffect, useState, useReducer } from "react";
import styled from "styled-components";
import ReactDOM from "react-dom";
import Login from "./Login";
import NameEntry from "./NameEntry";
import ChatRoom from "./ChatRoom";
import SocketContext from "../components/SocketContext";
import Socket from "../socket";

type RoomState = {
    [id: string]: string,
}

type RoomAction = {
    type: "ADD",
    id: string,
    name: string,
} | {
    type: "DELETE",
    id: string,
};

function reduceRooms(state: RoomState, action: RoomAction): RoomState {
    switch (action.type) {
        case "ADD": {
            return { ...state, [action.id]: action.name };
        }
        case "DELETE": {
            const newState = { ...state };
            delete newState[action.id];
            return newState;
        }
        default:
            return state;
    }
}

const Root: FC<{ className?: string }> = ({ className }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [room, setRoom] = useState<string | null>(null);
    const [rooms, roomDispatch] = useReducer(reduceRooms, {});

    useEffect(() => {
        Socket.init().then(setSocket);
        return () => { socket?.close() };
    }, []);

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.listRooms().then(rooms => Object.entries(rooms).forEach(([id, name]) =>
            roomDispatch({ type: "ADD", id, name })
        ));
        const removeOnAdd = socket.onAddRoom((id, name) => roomDispatch({ type: "ADD", id, name }));
        const removeOnDelete = socket.onDeleteRoom((id) => roomDispatch({ type: "DELETE", id }));
        return () => {
            removeOnAdd();
            removeOnDelete();
        }
    }, [socket]);

    const handleSetUserName = useCallback((name: string) => {
        socket?.setUserName(name)?.then(() => setUserName(name));
    }, [socket]);
    const handleLeaveRoom = useCallback(() => {
        Promise.resolve(socket?.leaveRoom()).then(() => setRoom(null));
    }, [socket]);
    const handleSelectRoom = useCallback((id: string) => {
        socket?.joinRoom(id).then(() => setRoom(id));
    }, [socket]);
    const handleCreateRoom = useCallback((name: string) => {
        socket?.createRoom(name).then(id => {
            setRoom(id);
        })
    }, [socket, rooms]);
    let content = null;
    if (!userName) {
        content = <NameEntry onSubmitName={handleSetUserName} />
    } else if (!room) {
        content =
            <Login
                onSelectRoom={handleSelectRoom}
                onCreateRoom={handleCreateRoom}
                rooms={rooms} />
    } else {
        content =
            <ChatRoom
                name={rooms[room]}
                onLeaveRoom={handleLeaveRoom}
                userID={socket!.id}
            />
    }
    return (
        <SocketContext.Provider value={{ socket }}>
            <div className={className}>
                {content}
            </div>
        </SocketContext.Provider>
    );
};

const StyledRoot = styled(Root)`
display: flex;
height: 100vh;
background-image: -webkit-linear-gradient(45deg, rgba(80, 124, 248) 70%, rgba(173, 198, 255) 30%);
`

ReactDOM.render(<StyledRoot />, document.getElementById('react-root'));