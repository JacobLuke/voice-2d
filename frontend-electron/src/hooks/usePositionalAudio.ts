import { useEffect, useCallback, useState } from "react";

export default function usePositionalAudio(listenerPos: { x: number, y: number } | null) {
    const [ctx] = useState<AudioContext>(new AudioContext);
    useEffect(() => {
        if (!listenerPos) {
            return;
        }
        const listener = ctx.listener;
        listener.positionX.value = listenerPos.x;
        listener.positionY.value = listenerPos.y;
    }, [ctx, listenerPos?.x, listenerPos?.y])
    const playPositionalAudio = useCallback((sourcePos: { x: number, y: number }, data: Int16Array) => {
        const buffer = ctx.createBuffer(1, data.length, 44100);
        buffer.copyToChannel(new Float32Array(data).map(i => i / 0x7fff), 0);
        const bufferSource = ctx.createBufferSource();
        bufferSource.buffer = buffer;
        const panner = ctx.createPanner();
        panner.distanceModel = "inverse";
        panner.refDistance = 5;
        panner.maxDistance = 1000;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        panner.rolloffFactor = 0.1;
        bufferSource.connect(panner);
        panner.connect(ctx.destination);
        bufferSource.start()
    }, [ctx]);

    return { playPositionalAudio };
}