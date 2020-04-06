
import { RTCPeerConnection, RTCRtpTransciever, nonstandard } from "wrtc";

const { RTCAudioSink } = nonstandard;

const TIME_TO_CONNECT_MS = 10 * 1000;
const TIME_TO_RECONNECT_MS = 10 * 1000;
const TIME_TO_HOST_CANDIDATES_MS = 10 * 1000;

export default class PeerConnection {
    public get state() {
        return this._state;
    }

    get localDescription() {
        return {
            type: this.connection.localDescription.type,
            sdp: this.connection.localDescription.sdp.replace(/\r\na=ice-options:trickle/g, '')
        }
    };

    get remoteDescription() {
        return this.connection.remoteDescription ? {
            type: this.connection.remoteDescription.type,
            sdp: this.connection.remoteDescription.sdp,
        } : {};
    }
    private _state: "open" | "closed" = "open";
    private _connectTimer: number | null = null;
    private _reconnectTimer: number | null = null;
    private _onIceConnectionStateChange: () => void;

    constructor(private readonly id: string, private readonly connection: RTCPeerConnection) {
        this._onIceConnectionStateChange = () => this.handleIceConnectionStateChange();
    }

    static async initialize(id: string): Promise<PeerConnection> {
        const connection = new RTCPeerConnection({
            sdpSemantics: "unified-plan",
        });
        const audioTransceiver = connection.addTransceiver('audio');
        const sink = new RTCAudioSink(audioTransceiver.receiver.track);
        sink.addEventListener('data', console.log.bind(console));

        const instance = new this(id, connection);

        instance._connectTimer = setTimeout(() => {
            if (connection.iceConnectionState !== 'connected'
                && connection.iceConnectionState !== 'completed') {
                instance.close();
            }
        }, TIME_TO_CONNECT_MS);


        connection.addEventListener('iceconnectionstatechange', instance._onIceConnectionStateChange);
        await instance.doOffer();
        return instance;
    }

    async doOffer(): Promise<void> {
        const offer = await this.connection.createOffer();
        this.connection.setLocalDescription(offer);
        if (this.connection.iceGatheringState === 'complete') {
            return;
        }

        return new Promise((resolve, reject) => {

            const timeout = setTimeout(() => {
                this.connection.removeEventListener('icecandidate', onIceCandidate);
                reject(new Error('Timed out waiting for host candidates'));
            }, TIME_TO_HOST_CANDIDATES_MS);

            const onIceCandidate = ({ candidate }: { candidate: any }) => {
                if (!candidate) {
                    clearTimeout(timeout);
                    this.connection.removeEventListener('icecandidate', onIceCandidate);
                    resolve();
                }
            };

            this.connection.addEventListener('icecandidate', onIceCandidate);
        });

    }

    addTransciever(): RTCRtpTransciever {
        return this.connection.addTransceiver("audio");
    }


    handleIceConnectionStateChange() {
        if (this.connection.iceConnectionState === 'connected'
            || this.connection.iceConnectionState === 'completed') {
            if (this._connectTimer) {
                clearTimeout(this._connectTimer);
                this._connectTimer = null;
            }
            clearTimeout(this._reconnectTimer || undefined);
            this._reconnectTimer = null;
        } else if (this.connection.iceConnectionState === 'disconnected'
            || this.connection.iceConnectionState === 'failed') {
            if (!this._connectTimer && !this._reconnectTimer) {
                this._reconnectTimer = setTimeout(() => {
                    this.close();
                }, TIME_TO_RECONNECT_MS);
            }
        }
    };

    async close(): Promise<void> {
        this.connection.removeEventListener('iceconnectionstatechange', this._onIceConnectionStateChange);
        if (this._connectTimer) {
            clearTimeout(this._connectTimer);
            this._connectTimer = null;
        }
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
        this.connection.close();
        this._state = "closed";
    }

    async setRemoteDescription(description: {}) {
        return this.connection.setRemoteDescription(description);
    }

    toJSON() {
        return {
            id: this.id,
            state: this.state,
            iceConnectionState: this.connection.iceConnectionState,
            localDescription: this.localDescription,
            remoteDescription: this.remoteDescription,
            signalingState: this.connection.signalingState,
        }
    }
}