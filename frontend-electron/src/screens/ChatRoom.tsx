import React, { FC, useRef, useEffect, useReducer, useCallback } from "react";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import styled from "styled-components";
import Plane from "../components/Plane";
import useInputAudio from "../hooks/useInputAudio";
import useSocket from "../hooks/useSocket";
import { RoomMember } from "../socket"

type ReducerState = {
    [id: string]: RoomMember
}

type ReducerAction = {
    type: "ADD",
    id: string,
    user: RoomMember,
} | {
    type: "REMOVE"
    id: string,
} | {
    type: "MOVE",
    id: string,
    pos: {
        x: number,
        y: number,
    }
}

function reduce(state: ReducerState, action: ReducerAction): ReducerState {
    switch (action.type) {
        case "ADD": {
            const { id, user } = action;
            return { ...state, [id]: user };
        }
        case "REMOVE": {
            const newState = { ...state };
            delete newState[action.id];
            return newState;
        }
        case "MOVE": {
            if (!state[action.id]) {
                return state;
            }
            const user: RoomMember = { ...state[action.id], pos: action.pos };
            return { ...state, [action.id]: user };
        }
    }
}

const ChatRoom: FC<{
    name: string,
    userID: string,
    onLeaveRoom: () => void,
    className?: string
}> = ({ name, userID, onLeaveRoom, className }) => {
    const { attachPeerConnection, toggleMuteAudio, muted } = useInputAudio();
    const [members, memberDispatch] = useReducer(reduce, {});
    const socket = useSocket();
    const handleUpdatePosition = useCallback(({ id, pos }: { id: string, pos: { x: number, y: number } }) => {
        socket?.updatePosition({ id, pos });
    }, [socket]);
    const handleAddSink = useCallback(() => {
        socket?.createSink()
    }, [socket]);
    const handleStartSink = useCallback((sink: string) => {
        socket?.startSink(sink)
    }, [socket]);
    const handleStopSink = useCallback((sink: string) => {
        socket?.stopSink(sink)
    }, [socket]);
    const handlePlaySink = useCallback((sink: string) => {
        socket?.playSink(sink)
    }, [socket]);
    useEffect(() => {
        if (!socket) {
            return;
        }
        socket.listRoomMembers().then(data => Object.entries(data).forEach(([id, user]) => {
            memberDispatch({ type: "ADD", id, user });
        }))
        const moveListener = (data: { id: string, pos: { x: number, y: number } }) => {
            memberDispatch({ type: "MOVE", ...data });
        };
        const addListener = (data: RoomMember & { id: string }) => {
            const { id, ...user } = data;
            memberDispatch({ type: "ADD", id, user });
        };
        const removeListener = (data: string[]) => {
            data.map(id => memberDispatch({ type: "REMOVE", id }));
        }
        const removeCallbacks = [
            socket.onMoveMember(moveListener),
            socket.onAddMember(addListener),
            socket.onRemoveMembers(removeListener),
        ];
        return () => removeCallbacks.forEach(fn => fn());
    }, [socket, memberDispatch]);
    useEffect(() => {
        return socket?.addGlobalPeerConnectionListener(attachPeerConnection);
    }, [socket, attachPeerConnection]);
    return (
        <div className={className}>
            <header>
                <h1>{name}</h1>
                <button onClick={onLeaveRoom}>Leave Room</button>
                <button onClick={toggleMuteAudio}>{muted ? "Unmute Microphone" : "Mute Microphone"}</button>
            </header>
            <DndProvider backend={Backend}>
                <Plane
                    members={members}
                    userID={userID}
                    onMoveMember={handleUpdatePosition}
                    onPlaySink={handlePlaySink}
                    onStartSink={handleStartSink}
                    onStopSink={handleStopSink}
                />
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