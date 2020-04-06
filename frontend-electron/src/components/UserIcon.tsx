import React, { FC, useEffect, useCallback } from "react";
import { useDrag } from "react-dnd";
import styled from "styled-components";
import usePositionalAudio from "../hooks/usePositionalAudio";
import useSocket from "../hooks/useSocket";

type Props = {
    pos: { x: number, y: number },
    listenerPos: { x: number, y: number },
    name: string,
    draggable: boolean,
    id: string,
    className?: string
}

const UserIcon: FC<Props> = ({ pos, listenerPos, name, draggable, id, className, }) => {
    const [_collected, drag] = useDrag({
        item: { id, type: "UserIcon", x: pos.x, y: pos.y },
        canDrag: () => draggable,
    });
    const socket = useSocket();
    const { setPeerConnection } = usePositionalAudio(listenerPos, pos);
    useEffect(() => {
        return socket?.addPeerConnectionListener(id, setPeerConnection);
    }, [socket, setPeerConnection]);
    return <div ref={drag} className={className}>
        <div className="icon" />
        <label>{name}</label>
    </div>
}

export default styled(UserIcon)(props => `
  position: absolute;
  top: ${props.pos.y * 5 - 10}px;
  left: ${props.pos.x * 5 - 10}px;
  .icon {
      width: 20px;
      height: 20px;
      border: 2px solid black;
      border-radius: 50%;
  }
  label {
      width: 20px;
      text-align: center;
      text-overflow: ellipsis;
  }
`);