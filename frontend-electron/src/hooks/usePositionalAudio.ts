import { useEffect, useCallback, useState } from "react";

export default function usePositionalAudio(listenerPos: { x: number, y: number } | null) {
    const playPositionalAudio = useCallback((sourcePos: { x: number, y: number }, data: Int16Array) => {
        const context = new AudioContext();
        if (listenerPos) {
            context.listener.positionX.value = listenerPos.x;
            context.listener.positionZ.value = listenerPos.y;
        }

        const buffer = context.createBuffer(2, data.length, 44100);
        const floatData = new Float32Array(data).map(i => i / 0x7fff);
        buffer.copyToChannel(floatData, 0);
        buffer.copyToChannel(floatData, 1);
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = buffer;
        const panner = context.createPanner();
        panner.distanceModel = "inverse";
        panner.refDistance = 5;
        panner.maxDistance = 1000;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;
        panner.rolloffFactor = 1;
        panner.positionX.value = sourcePos.x;
        panner.positionZ.value = sourcePos.y;
        bufferSource.connect(panner);
        panner.connect(context.destination);
        bufferSource.start()
    }, [listenerPos?.x, listenerPos?.y]);

    return { playPositionalAudio };
}