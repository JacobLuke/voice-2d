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
        <section>
            <h1>Enter a room</h1>
        </section>
        <section className="form">
            <h3>Join an existing room</h3>
            <div className="formFields">
                <select onChange={handleChangeSelected} value={selectedRoom} disabled={!Object.keys(rooms).length}>
                    <option value={undefined}>Select a room</option>
                    {Object.entries(rooms).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                </select>
            </div>
            <button disabled={!selectedRoom} onClick={handleJoinRoom}>Join room</button>
        </section>
        <section className="form">
            <h3>Create a new room</h3>
            <div className="formFields">
                <input value={roomName} onChange={handleRoomChange} />
            </div>
            <button disabled={!roomName} onClick={handleCreateRoom}>Create room</button>
        </section>
    </div>
}

export default styled(Login)`
h1 {
    text-align: left;
    color: white;
    font-size: 36px;
    margin: 0px;
}
h3 {
    color: rgba(173,198,255);
    font-size: 18px;
}
width: 100%;
justify-content: center;
align-items: center;
display: flex;
flex-direction: column;
> section {
    width: 50%;
    margin: 15px 0px;
}
> .form {
  button {
      display: block;
      font-size: 14px;
      color: rgba(249, 224, 189);
      background: transparent;
      border: 1px solid;
      border-color: rgba(249, 224, 189);
      border-radius: 4px;
      padding: 10px 15px;
      margin: 15px 0px;
      cursor: pointer;
  }
  button: hover {
      background: rgba(249, 224, 189);
      color: rgba(80, 124, 248);
  }
  button: disabled {
    background: transparent;
    color: rgba(249, 224, 189);
  }
  select {
      width: 200px;
      font-size: 14px;
      outline: 0;
      border-width: 0 0 2px;
      border-color: white;
      border-radius: 0px;
      background: transparent;
      -webkit-appearance: none;
      -moz-appearance: none;
      cursor: pointer;
      color: white;
  }
  input {
    outline: 0;
    border-width: 0 0 2px;
    border-color: white;
    background: transparent;
    font-size: 14px;
    margin: 10px 0px 0px 0px;
    display: block;
    color: white;
    width: 200px;
  }
  input:focus {
    border-color: rgba(249, 224, 189);
  }
  .formFields {
    margin: 25px 0px;
  }
}
`;