import { useEffect, useCallback, useState } from "react";

export default function usePositionalAudio(
    listenerPos: { x: number, y: number },
    sourcePos: { x: number, y: number },
    attachAudioListener: (callback: (data: Int16Array) => void) => (() => void),
) {
    const [context] = useState<AudioContext>(new AudioContext());
    const [start, setStart] = useState<number>(0);
    const [panner] = useState<PannerNode>(context.createPanner());
    useEffect(() => {
        panner.distanceModel = "inverse";
        panner.refDistance = 5;
        panner.maxDistance = 1000;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        panner.rolloffFactor = 1;
        panner.positionX.value = sourcePos.x;
        panner.positionZ.value = sourcePos.y;
        panner.connect(context.destination);
    }, [sourcePos.x, sourcePos.y]);
    useEffect(() => {
        context.listener.positionX.value = listenerPos.x;
        context.listener.positionZ.value = listenerPos.y;
    }, [listenerPos.x, listenerPos.y])
    const playPositionalAudio = useCallback((data: Int16Array) => {
        const buffer = context.createBuffer(2, data.length, 44100);
        const floatData = new Float32Array(data).map(i => i / 0x7fff);
        buffer.copyToChannel(floatData, 0);
        buffer.copyToChannel(floatData, 1);
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = buffer;
        const currentStart = Math.max(context.currentTime, start);
        setStart(currentStart + buffer.duration);
        bufferSource.connect(panner);
        bufferSource.start(currentStart);
    }, [listenerPos.x, listenerPos.y, sourcePos.x, sourcePos.y, start, context, panner]);
    useEffect(() => attachAudioListener(playPositionalAudio), [playPositionalAudio]);
}