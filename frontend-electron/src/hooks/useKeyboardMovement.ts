import { useEffect } from "react";

export default function useKeyboardMovement(pos: { x: number, y: number }, onUpdate: (newPos: { x: number, y: number }) => void, bounds: { x: [number, number], y: [number, number] }) {

    const { x: [minX, maxX], y: [minY, maxY] } = bounds;
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            const newPos = { ...pos };
            switch (e.keyCode) {
                case 37:
                    newPos.x = Math.max(newPos.x - 1, minX);
                    break;
                case 39:
                    newPos.x = Math.min(newPos.x + 1, maxX);
                    break;
                case 38:
                    newPos.y = Math.max(newPos.y - 1, minY);
                    break;
                case 40:
                    newPos.y = Math.min(newPos.y + 1, maxY);
                    break;
                default:
                    return;
            }
            onUpdate(newPos);

        }
        document.addEventListener('keydown', handleKeydown);
        return () => document.removeEventListener('keydown', handleKeydown);
    }, [onUpdate, pos.x, pos.y, minX, maxX, minY, maxY]);
}