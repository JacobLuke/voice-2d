import React, { FC, useRef, useEffect } from "react";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import styled from "styled-components";
import Plane from "../components/Plane";
import useInputAudio from "../hooks/useInputAudio";

const ChatRoom: FC<{
    name: string,
    width: number,
    height: number,
    users: { [id: string]: { name: string, x: number, y: number } },
    userID: string,
    onUpdatePosition: (id: string, x: number, y: number) => void,
    onReceiveAudio: (buffer: Int16Array) => void,
    onLeaveRoom: () => void,
    className?: string
}> = ({ name, width, height, users, userID, onUpdatePosition, onLeaveRoom, className, onReceiveAudio }) => {
    const { loading, error } = useInputAudio(onReceiveAudio);
    return (
        <div className={className}>
            <header>
                <h1>{name}</h1>
                <button onClick={onLeaveRoom}>Leave Room</button>
            </header>
            <DndProvider backend={Backend}>
                <Plane width={width} height={height} users={users} userID={userID} onMoveUser={onUpdatePosition} />
            </DndProvider >
        </div>
    )

};

export default styled(ChatRoom)`
width: 90%;
height: 90%;
margin: auto;
header {
    overflow: auto;
    margin: 10px;
    h1 {
        float: left;
    }
    button {
        float: right;
    }
}
`;