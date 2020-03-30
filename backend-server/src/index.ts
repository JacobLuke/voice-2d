import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import ChatRoom from "./Room";

const PORT = parseInt(process.env.PORT!) || 5000;

const app = express();
app.use(express.json());

const server = new Server({
    server: createServer(app),
});

server.define("chat", ChatRoom);

server.listen(PORT).then(response => {
    const info = server.transport.address();
    console.info(`Server live at ${info.address}:${info.port}`);
})