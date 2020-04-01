import React, { FC, useState, useEffect, useCallback, ChangeEvent, useMemo } from "react";
import styled from "styled-components"

const Login: FC<{
    rooms: { [id: string]: string },
    onCreateRoom: (name: string) => void,
    onSelectRoom: (id: string) => void,
    className?: string,
}> = ({ onCreateRoom, onSelectRoom, className, rooms }) => {
    const [selectedRoom, setSelectedRoom] = useState<string | undefined>(undefined);
    const [roomName, setRoomName] = useState<string>("");
    const handleRoomChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setRoomName(event.target.value), [])
    const handleChangeSelected = useCallback((event: ChangeEvent<HTMLSelectElement>) => setSelectedRoom(event.target.value), []);
    const handleCreateRoom = useCallback(() => onCreateRoom(roomName), [roomName]);
    const handleJoinRoom = useCallback(() => onSelectRoom(selectedRoom!), [selectedRoom]);
    return <div className={className}>
        <h1>Enter A Plane</h1>
        <section>
            <h2>Join Existing Plane</h2>
            <select onChange={handleChangeSelected} value={selectedRoom} disabled={!Object.keys(rooms).length}>
                <option value={undefined} />
                {Object.entries(rooms).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
            </select>
            <button disabled={!selectedRoom} onClick={handleJoinRoom}>Join</button>
        </section>
        <section>
            <h2>Create New Plane</h2>
            <p>
                <label>Name</label>
                <input value={roomName} onChange={handleRoomChange} />
            </p>
            <button disabled={!roomName} onClick={handleCreateRoom}>Create</button>
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