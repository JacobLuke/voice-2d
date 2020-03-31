import React, { FC, useCallback } from "react";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import styled from "styled-components";
import Plane from "../components/Plane";

const ChatRoom: FC<{
    width: number,
    height: number,
    users: { [id: string]: { name: string, x: number, y: number } },
    userID: string,
    onUpdatePosition: (id: string, x: number, y: number) => void,
    onLeaveRoom: () => void,
    className?: string
}> = ({ width, height, users, userID, onUpdatePosition, onLeaveRoom, className }) => {
    return (
        <div className={className}>
            <header>
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