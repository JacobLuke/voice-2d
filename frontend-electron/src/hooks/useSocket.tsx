import { useContext } from "react";
import SocketContext from "../components/SocketContext";

export default function () {
    const { socket } = useContext(SocketContext);
    return socket;
}