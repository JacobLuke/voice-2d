import { useState, useEffect } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";
const mapChannelData = (buffer: Float32Array): Int16Array =>
    new Int16Array(buffer.map(item => Math.max(Math.min(1, item), -1) * 0x7fff))
export default function useInputAudio(onReceiveAudio: (buffer: Int16Array) => void) {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const accessListener = (_event: IpcRendererEvent, hasAccess: boolean) => {
            setHasAccess(hasAccess);
        }
        ipcRenderer.on("requestMicrophone$response", accessListener);
        ipcRenderer.send("requestMicrophone");
        return () => {
            ipcRenderer.removeListener("requestMicrophone$response", accessListener)
        };
    }, []);
    useEffect(() => {
        if (hasAccess === null) {
            return;
        }
        if (hasAccess) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
                setLoading(false);
                setStream(stream);
            }, error => {
                setLoading(false);
                setError(error.message);
            })
        } else {
            setLoading(false);
            setError("Microphone access disabled");
        }
    }, [hasAccess, onReceiveAudio]);
    useEffect(() => {
        if (!stream) {
            return;
        }
        const ctx = new AudioContext();
        const streamNode = ctx.createMediaStreamSource(stream);
        const gain = ctx.createGain();
        gain.gain.value = 1;
        const processorNode = ctx.createScriptProcessor(2048, 1, 1);
        processorNode.onaudioprocess = (event) => {
            onReceiveAudio(mapChannelData(event.inputBuffer.getChannelData(0)));
        }
        streamNode.connect(gain);
        gain.connect(processorNode);
        processorNode.connect(ctx.destination);
        return () => { ctx.close(); }
    }, [stream?.id, onReceiveAudio]);
    return { loading, error };
}