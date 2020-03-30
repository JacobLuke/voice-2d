import React, { FC, useState, useEffect, useCallback, ChangeEvent } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";

const Login: FC<{ onSelectRoom: (room: string | null) => void }> = ({ onSelectRoom }) => {
    const [rooms, setRooms] = useState<{ [id: string]: string }>({});
    const [isNewRoom, setIsNewRoom] = useState<boolean>(false);
    const [roomName, setRoomName] = useState<string>("");
    const toggleNewRoom = useCallback(() => setIsNewRoom(value => !value), []);
    const handleRoomChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setRoomName(event.target.value), [])
    const submitNewRoom = useCallback(() => {
        console.log(roomName);
        onSelectRoom(ipcRenderer.sendSync('rooms$new', roomName));
    }, [roomName]);
    useEffect(() => {
        ipcRenderer.send("rooms$get");
        const roomSetListener = (event: IpcRendererEvent, rooms: { [id: string]: string }) => {
            console.log(rooms);
            setRooms(rooms);
        }
        ipcRenderer.on("rooms$set", roomSetListener);
        return () => {
            ipcRenderer.removeListener("rooms$set", roomSetListener);
        }
    }, []);
    return <div>
        {!isNewRoom && <select onChange={event => onSelectRoom(event.target.value)}>
            <option value={undefined} />
            {Object.entries(rooms).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
        </select>}
        <button onClick={toggleNewRoom}>{isNewRoom ? "Join Existing Room" : "Create New Room"}</button>
        {isNewRoom &&
            <>
                <label>Enter name of room</label>
                <input value={roomName} onChange={handleRoomChange} />
                <button onClick={submitNewRoom}>Submit</button>
            </>
        }
    </div>
}

export default Login;