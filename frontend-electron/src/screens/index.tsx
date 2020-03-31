import React, { FC, useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Room } from "colyseus.js";
import ReactDOM from "react-dom";
import Login from "./Login";
import ChatRoom from "./ChatRoom";

const Root: FC<{ className?: string }> = ({ className }) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [users, setUsers] = useState<{ [id: string]: { name: string, x: number, y: number } }>({});

    useEffect(() => {
        if (!room) {
            return;
        }
        room.onLeave(() => {
            setRoom(null);
            setWidth(0);
            setHeight(0)
            setUsers({});
        });
        room.state.onChange = (changes: { field: 'width' | 'height' | 'players', value: any }[]) => {
            changes.forEach(({ field, value }) => {
                switch (field) {
                    case 'width':
                        setWidth(value);
                        break;
                    case 'height':
                        setHeight(value);
                        break;
                    case 'players':
                        setUsers(value.toJSON());
                        break;
                }
            });

        };
    }, [room])

    const handleUpdatePosition = useCallback((id: string, x: number, y: number) => {
        if (!room) {
            return;
        }
        room.send({ 'type': "Move", x, y, id });
    }, [room]);

    const handleSendAudio = useCallback((buffer: Float32Array) => {
        room?.send({ type: "Input", buffer });
    }, [room]);

    const handleLeaveRoom = useCallback(() => {
        room?.leave();
    }, [room])
    const content = room
        ? <ChatRoom
            onLeaveRoom={handleLeaveRoom}
            width={width}
            height={height}
            users={users}
            userID={room.sessionId}
            onUpdatePosition={handleUpdatePosition}
            onReceiveAudio={handleSendAudio} />
        : <Login onSelectRoom={setRoom} />
    return (
        <div className={className}>
            {content}
        </div>
    );
};

const StyledRoot = styled(Root)`
display: flex;
`

ReactDOM.render(<StyledRoot />, document.getElementById('react-root'));