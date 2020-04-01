import { WebSocketServer } from "@clusterws/cws";
import { createServer } from "http";
import { connectSocket } from "./socket"

const http = createServer();
const PORT = parseInt(process.env.PORT!) || 5000;

const server = new WebSocketServer({ server: http });

http.listen(PORT, () => {
    console.info(`Server running on ${PORT}`)
});

server.on("connection", (socket) => {
    connectSocket(socket)
})

server.startAutoPing(5000, true);