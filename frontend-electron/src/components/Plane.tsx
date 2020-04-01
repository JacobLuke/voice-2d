import React, { FC, useCallback, useEffect } from "react";
import { useDrop, DropTargetMonitor } from "react-dnd";
import styled from "styled-components";
import UserIcon from "./UserIcon"

type Props = {
    users: { [id: string]: { name: string, x: number, y: number } },
    userID: string,
    className?: string;
    onMoveUser: (id: string, x: number, y: number) => void,
}

const Plane: FC<Props> = ({
    users,
    userID,
    className,
    onMoveUser,
}) => {
    const handleDrop = useCallback((item: any, monitor: DropTargetMonitor) => {
        const { id, x, y } = item;
        const { x: dx, y: dy } = monitor.getDifferenceFromInitialOffset()!;
        onMoveUser(id, parseInt(x + (dx / 5)), parseInt(y + (dy / 5)));
    }, [])
    const [_collect, drop] = useDrop({
        accept: "UserIcon",
        drop: handleDrop,
    })
    return (
        <div className={className} ref={drop}>
            {Object.entries(users).map(([uid, user]) =>
                <UserIcon
                    id={uid}
                    key={uid}
                    draggable={uid === userID}
                    name={user.name}
                    x={user.x}
                    y={user.y}
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
