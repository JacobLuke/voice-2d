import React, { FC, useState, useEffect, useCallback, ChangeEvent, useMemo } from "react";
import { Client, Room } from "colyseus.js";
import styled from "styled-components"

const Login: FC<{
    onSelectRoom: (room: Room) => void,
    onSetRoomName: (name: string | null) => void,
    className?: string,
}> = ({ onSelectRoom, onSetRoomName, className }) => {
    const [rooms, setRooms] = useState<{ [id: string]: string }>({});
    const [selectedRoom, setSelectedRoom] = useState<string | undefined>(undefined);
    const [userName, setUserName] = useState<string>("");
    const [roomName, setRoomName] = useState<string>("");
    const colyseus = useMemo(() => new Client(process.env.BACKEND_SERVER_URL), []);
    const handleUserChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setUserName(event.target.value), [])
    const handleRoomChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setRoomName(event.target.value), [])
    const submitNewRoom = useCallback(() => {
        colyseus.create("chat", { displayName: roomName, userName }).then(onSelectRoom);
        onSetRoomName(roomName);
    }, [roomName, userName]);
    const joinExistingRoom = useCallback(() => {
        colyseus.joinById(selectedRoom!, { userName }).then(onSelectRoom);
        onSetRoomName(rooms[selectedRoom!]);
    }, [selectedRoom, userName])
    const handleChangeSelected = useCallback((event: ChangeEvent<HTMLSelectElement>) => setSelectedRoom(event.target.value), []);
    useEffect(() => {
        colyseus.getAvailableRooms<{ displayName: string }>().then(rooms => {
            const byId: { [id: string]: string } = {};
            rooms.forEach(room => {
                byId[room.roomId] = room.metadata!.displayName;
            });
            setRooms(byId);
        })
    }, []);
    return <div className={className}>
        <h1>Enter A Plane</h1>
        <section>
            <p>
                <label>
                    What's your name?
                </label>
                <input value={userName} onChange={handleUserChange} />
            </p>
        </section>
        <section>
            <h2>Join Existing Plane</h2>
            <select onChange={handleChangeSelected} value={selectedRoom} disabled={!Object.keys(rooms).length}>
                <option value={undefined} />
                {Object.entries(rooms).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
            </select>
            <button onClick={joinExistingRoom} disabled={!selectedRoom || !userName}>Join</button>
        </section>
        <section>
            <h2>Create New Plane</h2>
            <p>
                <label>Name</label>
                <input value={roomName} onChange={handleRoomChange} />
            </p>
            <button onClick={submitNewRoom} disabled={!roomName || !userName}>Create</button>
        </section>
    </div>
}

export default styled(Login)`
h1 {
    text-align: center;
}
background: #6699CC;
width: 100%;
flex-basis: 600px;
margin: 10px auto;
padding: 5px;
display: flex;
flex-direction: column;
> section {
  flex: 1;
  background: white;
  border: 2px solid grey;
  border-radius: 5px;
  margin: 5px;
  padding: 10px;
  button {
      display: block;
      margin: 10px auto;
      font-size: 18px;
      horizontal-align: right;
  }
  select {
      width: 100%;
      font-size: 24px;
  }
  p {
      margin: auto;
      width: 100%;
      overflow: auto;
      font-size: 24px;
      > label {
          float: left;
      }
      > input {
          line-height: 24px;
          font-size: 24px;
          float: right;
      }
  }
}
`;