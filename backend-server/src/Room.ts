import { Room, Client } from "colyseus";
import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { random } from "lodash";

class Player extends Schema {
    @type("int32")
    x = 0;
    @type("int32")
    y = 0;
    @type("string")
    name = "John";
}

class Audio extends Schema {
    @type("string")
    userSessionID = "";
    @type(["int16"])
    source = new ArraySchema<number>();
}

class State extends Schema {
    @type({ map: Player })
    players = new MapSchema<Player>();
    @type("int32")
    width = 100;
    @type("int32")
    height = 100;
}

type Move = {
    type: "Move"
    x: number,
    y: number
} | {
    type: "Input",
    audio: number[],
}

type Message = Move;

export default class ChatRoom extends Room<State> {
    onCreate(options: { displayName: string }) {
        this.setState(new State({ width: 100, height: 100 }));
        this.setMetadata({ displayName: options.displayName })
    }
    onJoin(client: Client, options: { userName: string } & ({ x: number, y: number } | { x: undefined, y: undefined })) {
        const [x, y] = options.x == null || options.y == null
            ? [random(0, this.state.width), random(0, this.state.width)]
            : [options.x, options.y];
        const player = new Player();
        player.name = options.userName;
        player.x = x;
        player.y = y;
        this.state.players[client.sessionId] = player;
    }
    onLeave(client: Client) {
        this.state.players[client.sessionId] = undefined;
    }
    onMessage(client: Client, message: Message) {
        const player: Player = this.state.players[client.sessionId];
        if (!player) {
            return;
        }
        if (message.type === "Move") {
            player.x = message.x;
            player.y = message.y;
        } else if (message.type === "Input") {
            const data = new Audio();
            data.userSessionID = client.sessionId;
            if (message.audio.length !== 2048) {
                console.log(message.audio);
            }
            data.source.splice(0, data.source.length, ...Array.from({ length: message.audio.length }, (_, k) => message.audio[k] || 0));
            this.broadcast(data);
        }
    }
}