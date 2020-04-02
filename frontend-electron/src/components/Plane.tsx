import React, { FC, useCallback, useEffect } from "react";
import { useDrop, DropTargetMonitor } from "react-dnd";
import styled from "styled-components";
import UserIcon from "./UserIcon"
import { RoomMember } from "../socket";

type Props = {
    members: { [id: string]: RoomMember },
    userID: string,
    className?: string;
    onMoveMember: (data: { id: string, pos: { x: number, y: number } }) => void,
}

const Plane: FC<Props> = ({
    members,
    userID,
    className,
    onMoveMember,
}) => {
    const handleDrop = useCallback((item: any, monitor: DropTargetMonitor) => {
        const { id, x, y } = item;

        const { x: dx, y: dy } = monitor.getDifferenceFromInitialOffset()!;
        onMoveMember({ id, pos: { x: parseInt(x + (dx / 5)), y: parseInt(y + (dy / 5)) } });
    }, [])
    const [_collect, drop] = useDrop({
        accept: "UserIcon",
        drop: handleDrop,
    })
    return (
        <div className={className} ref={drop}>
            {Object.entries(members).map(([uid, member]) =>
                <UserIcon
                    id={uid}
                    key={uid}
                    draggable={(member.type === "USER" && uid === userID) || (member.type === "SINK" && member.owner === userID)}
                    name={(member.type === "USER" && member.name) || "SINK"}
                    x={member.pos.x}
                    y={member.pos.y}
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
