import React, { FC, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import ReactDOM from "react-dom";
import Login from "./Login";
import NameEntry from "./NameEntry";
import ChatRoom from "./ChatRoom";
import SocketContext from "../components/SocketContext";
import Socket from "../socket";

const Root: FC<{ className?: string }> = ({ className }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [room, setRoom] = useState<string | null>(null);
    const [rooms, setRooms] = useState<{ [id: string]: string }>({});

    useEffect(() => {
        Socket.init().then(setSocket);
        return () => { socket?.close() };
    }, []);

    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.listRooms().then(setRooms);
    }, [socket]);

    const handleSendAudio = useCallback((buffer: Int16Array) => {
        socket?.sendAudio(buffer);
    }, [socket]);
    const handleSetUserName = useCallback((name: string) => {
        socket?.setUserName(name)?.then(() => setUserName(name));
    }, [socket]);
    // useInputAudio(handleSendAudio);
    const handleLeaveRoom = useCallback(() => {
        Promise.resolve(socket?.leaveRoom()).then(() => setRoom(null));
    }, [socket]);
    const handleSelectRoom = useCallback((id: string) => {
        socket?.joinRoom(id).then(() => setRoom(id));
    }, [socket]);
    const handleCreateRoom = useCallback((name: string) => {
        socket?.createRoom(name).then(id => {
            setRooms(rooms => ({
                ...rooms,
                [id]: name,
            }));
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
                onReceiveAudio={handleSendAudio}
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
`

ReactDOM.render(<StyledRoot />, document.getElementById('react-root'));