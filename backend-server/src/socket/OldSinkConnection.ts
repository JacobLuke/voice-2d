import { nonstandard } from "wrtc";
import PeerConnection from "./PeerConnection";
import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";
import { StreamInput } from "fluent-ffmpeg-multistream"
const { RTCAudioSink, RTCAudioSource } = nonstandard;

export default class SinkConnection {

    public get state() {
        return this._state;
    }

    private readonly _sources: { [id: string]: PassThrough } = {};
    private _state: "waiting" | "recording" | "recorded" = "waiting";

    private constructor(private readonly id: string) { }

    static async initialize(id: string): Promise<SinkConnection> {
        return new this(id);
    }

    addInputConnection(sourceID: string, connection: PeerConnection) {
        if (this.state !== "recording") {
            return;
        }
        if (!this._sources[sourceID]) {
            const source = new PassThrough();
            this._sources[sourceID] = source;
            const transceiver = connection.addTransciever();
            const sink = new RTCAudioSink(transceiver.receiver.track)
            const onAudio = (data: { samples: { buffer: ArrayBuffer } }) => {
                source.push(Buffer.from(data.samples.buffer));
            }
            sink.addEventListener('data', onAudio);
            source.on("end", () => sink.removeEventListener('data', onAudio));
        }
    }

    onStartRecord() {
        if (this.state !== "waiting") {
            return;
        }
        this._state = "recording";
        Object.keys(this._sources).forEach(sourceID => {
            this._sources[sourceID].end();
            delete this._sources[sourceID];
        })
    }

    onStopRecord() {
        if (this.state !== "recording") {
            return;
        }
        this._state = "recorded";
        const mergedStream = ffmpeg().format('mp3')
        Object.values(this._sources).forEach(data => {
            data.end();
            mergedStream.addInput(new StreamInput(data).url)
                .addInputOptions([
                    '-f s16le',
                    '-ar 48k',
                    '-ac 1',
                ])
        })

        mergedStream.output(`./sink-output/${this.id}.mp3`);
        mergedStream.run();
    }

    close() {
        Object.keys(this._sources).forEach(sourceID => {
            this._sources[sourceID].end();
            delete this._sources[sourceID];
        })
    }
}