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
    useEffect(() => {
        document.addEventListener('keydown', moveUserIcon);
    }, []);
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
    const moveUserIcon = (e: any) => {
        var keyCode = e.keyCode;
        const newPos = listenerPos;
        switch (keyCode) {
            case 37:
                newPos.x = newPos.x - 1 >= 0 ? newPos.x - 1 : 0;
            break;
            case 39:
                newPos.x = newPos.x + 1 <= 100 ? newPos.x + 1 : 100;
            break;
            case 38:
                newPos.y = newPos.y - 1 >= 0 ? newPos.y - 1 : 0;
            break;
            case 40:
                newPos.y = newPos.y + 1 <= 100 ? newPos.y + 1 : 100;
            break;
        }
        onMoveMember({ id: userID, pos: newPos });
    }

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
