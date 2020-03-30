import React, { FC, useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { v4 as uuid } from "uuid";
import Login from "./screens/Login";
import Room from "./screens/Room";

const Root: FC<{}> = () => {
    const [id, setID] = useState<string | null>(null);
    const [room, setRoom] = useState<string | null>(null);
    const onLeaveRoom = useCallback(() => setRoom(null), []);
    useEffect(() => {
        setID(uuid());
    }, []);
    if (!id) {
        return <div>Loading...</div>
    }
    if (!room) {
        return <Login onSelectRoom={setRoom} />
    }
    return <Room room={room} id={id} onLeaveRoom={onLeaveRoom} />;
};
ReactDOM.render(<Root />, document.getElementById('react-root'));