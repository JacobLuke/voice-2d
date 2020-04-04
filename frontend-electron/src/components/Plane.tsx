import React, { FC, useCallback, useEffect } from "react";
import { useDrop, DropTargetMonitor } from "react-dnd";
import styled from "styled-components";
import SinkIcon from "./SinkIcon"
import UserIcon from "./UserIcon"
import { RoomMember } from "../socket";

type Props = {
    members: { [id: string]: RoomMember },
    userID: string,
    className?: string;
    onMoveMember: (data: { id: string, pos: { x: number, y: number } }) => void,
    onStartSink: (sinkID: string) => void,
    onStopSink: (sinkID: string) => void,
    onPlaySink: (sinkID: string) => void,
}

const Plane: FC<Props> = ({
    members,
    userID,
    className,
    onMoveMember,
    onStartSink,
    onStopSink,
    onPlaySink,
}) => {
    const handleDrop = useCallback((item: any, monitor: DropTargetMonitor) => {
        const { id, x, y } = item;

        const { x: dx, y: dy } = monitor.getDifferenceFromInitialOffset()!;
        onMoveMember({ id, pos: { x: parseInt(x + (dx / 5)), y: parseInt(y + (dy / 5)) } });
    }, [])
    const [_, drop] = useDrop({
        accept: "UserIcon",
        drop: handleDrop,
    })
    const listenerPos = members[userID]?.pos || { x: 50, y: 50 };
    return (
        <div className={className} ref={drop}>
            {Object.entries(members).map(([uid, member]) =>
                member.type === "USER"
                    ? <UserIcon
                        id={uid}
                        key={uid}
                        draggable={uid === userID}
                        name={(member.type === "USER" && member.name) || "SINK"}
                        pos={member.pos}
                        listenerPos={listenerPos}
                    />
                    : <SinkIcon
                        id={uid}
                        key={uid}
                        draggable={member.owner === userID}
                        pos={member.pos}
                        onStartRecord={onStartSink}
                        onStopRecord={onStopSink}
                        onPlayback={onPlaySink}
                        listenerPos={listenerPos}
                    />
            )}
        </div>
    )
}

export default styled(Plane)`
  background: #BBD9EE;
  position: relative;
  width: 500px;
  height: 500px;
`
