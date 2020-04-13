import React, { FC, useCallback, useEffect } from "react";
import { useDrop, DropTargetMonitor } from "react-dnd";
import styled from "styled-components";
import UserIcon from "./UserIcon"
import { RoomMember } from "../socket";
import useKeyboardMovement from "../hooks/useKeyboardMovement";

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
    const [_, drop] = useDrop({
        accept: "UserIcon",
        drop: handleDrop,
    })
    const listenerPos = members[userID]?.pos || { x: 50, y: 50 };
    const handleMoveMember = useCallback((newPos: { x: number, y: number }) => {
        onMoveMember({ id: userID, pos: newPos });
    }, [userID]);
    useKeyboardMovement(listenerPos, handleMoveMember, { x: [0, 100], y: [0, 100] })

    return (
        <div className={className} ref={drop}>
            {Object.entries(members).map(([uid, member]) => <UserIcon
                id={uid}
                key={uid}
                draggable={uid === userID}
                name={member.name}
                pos={member.pos}
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
