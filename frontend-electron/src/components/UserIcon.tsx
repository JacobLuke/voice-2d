import React, { FC } from "react";
import { useDrag } from "react-dnd";
import styled from "styled-components";

type Props = {
    x: number,
    y: number,
    name: string,
    draggable: boolean,
    id: string,
    className?: string
}

const UserIcon: FC<Props> = ({ x, y, name, draggable, id, className, }) => {
    const [_collected, drag] = useDrag({
        item: { id, type: "UserIcon", x, y },
        canDrag: () => draggable,
    });
    return <div ref={drag} className={className}>
        <div className="icon" />
        <label>{name}</label>
    </div>
}

export default styled(UserIcon)(props => `
  position: absolute;
  top: ${props.y * 5 - 10}px;
  left: ${props.x * 5 - 10}px;
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