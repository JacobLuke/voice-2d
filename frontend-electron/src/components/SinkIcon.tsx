import React, { FC, useCallback } from "react";
import { useDrag } from "react-dnd";
import styled from "styled-components";

type Props = {
    x: number,
    y: number,
    draggable: boolean,
    id: string,
    className?: string,
    onPlay: (id: string) => void,
}

const SinkIcon: FC<Props> = ({ x, y, draggable, id, className, onPlay }) => {
    const [_collected, drag] = useDrag({
        item: { id, type: "UserIcon", x, y },
        canDrag: () => draggable,
    });
    const handlePlayClick = useCallback(() => {
        onPlay(id)
    }, [id]);
    return (
        <div ref={drag} className={className}>
            <div className="icon" />
            <div className="controls">
                <span onClick={handlePlayClick}>▶</span>
            </div>
        </div>
    )
}

export default styled(SinkIcon)(props => `
  position: absolute;
  top: ${props.y * 5 - 10}px;
  left: ${props.x * 5 - 10}px;
  .icon {
      width: 20px;
      height: 20px;
      border: 2px solid black;
      border-radius: 50%;
  }
  .controls > span {
      font-size: 24px;
      cursor: pointer;
  }
`);