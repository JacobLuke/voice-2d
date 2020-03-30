import React, { FC, useEffect } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";

const Room: FC<{ id: string, room: string, onLeaveRoom: () => void }> = ({ room, id, onLeaveRoom }) => {
    useEffect(() => {
        const listener = (event: IpcRendererEvent, ...data: any[]) => {
            console.log(event, ...data)
        };
        ipcRenderer.send('rooms$join', { room, id });
        ipcRenderer.on(`rooms$${room}$state`, listener);
        return () => {
            ipcRenderer.removeListener(`rooms$${room}$state`, listener);
            ipcRenderer.send(`rooms$leave`, { room, id });
        }
    }, [room, id]);
    return (
        <div>
            <DndProvider backend={Backend}>
                <div>Hello from React</div>
            </DndProvider >
            <button onClick={onLeaveRoom}>Leave Room</button>
        </div>
    )

};

export default Room;