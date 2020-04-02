import { createContext } from "react";
import Socket from "../socket";


export default createContext<{ socket: Socket | null }>({ socket: null });