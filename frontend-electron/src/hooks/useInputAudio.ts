import { useState, useEffect, useCallback } from "react";
import { ipcRenderer, IpcRendererEvent } from "electron";
import useSocket from "./useSocket";
export default function useInputAudio() {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [muted, setMuted] = useState<boolean>(true);
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
    }, [hasAccess]);
    useEffect(() => {
        stream?.getAudioTracks()?.forEach(track => {
            track.enabled = !muted;
            console.log(track.id, track.enabled);
        });
    }, [stream, muted])
    const attachPeerConnection = useCallback((_id: string, peerConnection: RTCPeerConnection | null) => {
        if (!peerConnection) {
            return;
        }
        peerConnection.getSenders().forEach(sender => peerConnection.removeTrack(sender));
        stream?.getAudioTracks()?.forEach(track => {
            try {
                peerConnection.addTrack(track, stream);
            } catch (e) {
                console.error(e)
            }
        })
    }, [stream]);
    const toggleMuteAudio = useCallback(() => {
        setMuted(val => !val);
    }, [setMuted]);
    return { loading, error, attachPeerConnection, toggleMuteAudio, muted };
}