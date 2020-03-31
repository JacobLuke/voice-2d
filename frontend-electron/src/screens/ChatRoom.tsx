import React, { FC, useRef, useEffect } from "react";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import styled from "styled-components";
import Plane from "../components/Plane";
import useInputAudio from "../hooks/useInputAudio";

const ChatRoom: FC<{
    width: number,
    height: number,
    users: { [id: string]: { name: string, x: number, y: number } },
    userID: string,
    onUpdatePosition: (id: string, x: number, y: number) => void,
    onReceiveAudio: (buffer: Float32Array) => void,
    onLeaveRoom: () => void,
    className?: string
}> = ({ width, height, users, userID, onUpdatePosition, onLeaveRoom, className, onReceiveAudio }) => {
    const { data } = useInputAudio();
    useEffect(() => {
        if (data) {
            const ctx = new AudioContext();
            const stream = ctx.createMediaStreamSource(data);
            const gain = ctx.createGain();
            gain.gain.value = 1;
            const processorNode = ctx.createScriptProcessor(1024, 1, 1);
            processorNode.onaudioprocess = (event) => {
                onReceiveAudio(event.inputBuffer.getChannelData(0));
            }
            stream.connect(gain);
            gain.connect(processorNode);
            processorNode.connect(ctx.destination);
            return () => { ctx.close(); }
        }
    }, [data?.id])
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