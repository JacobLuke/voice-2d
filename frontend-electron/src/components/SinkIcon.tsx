import React, { FC, useCallback, useState } from "react";
import { useDrag } from "react-dnd";
import styled from "styled-components";

type Props = {
    x: number,
    y: number,
    draggable: boolean,
    id: string,
    className?: string,
    onStartRecord: (id: string) => void,
    onStopRecord: (id: string) => void,
    onPlayback: (id: string) => void,
}

const SinkIcon: FC<Props> = ({ x, y, draggable, id, className, onPlayback, onStopRecord, onStartRecord }) => {
    const [status, setStatus] = useState<"RECORDING" | "RECORDED" | "EMPTY">("EMPTY");
    const [_collected, drag] = useDrag({
        item: { id, type: "UserIcon", x, y },
        canDrag: () => draggable,

    });
    const handlePlayClick = useCallback(() => {
        onPlayback(id);
    }, [id, setStatus, onPlayback]);
    const handleStartRecord = useCallback(() => {
        onStartRecord(id);
        setStatus("RECORDING");
    }, [id, setStatus, onStartRecord]);
    const handleStopRecord = useCallback(() => {
        onStopRecord(id);
        setStatus("RECORDED");
    }, [id, setStatus, onStopRecord]);
    let button = null;
    if (status === "EMPTY") {
        button = <span onClick={handleStartRecord}>⚫</span>
    } else if (status === "RECORDING") {
        button = <span onClick={handleStopRecord}>◼</span>
    } else {
        button = <span onClick={handlePlayClick}>▶</span>
    }
    return (
        <div ref={drag} className={className}>
            <div className="icon" />
            <div className="controls">
                {button}
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