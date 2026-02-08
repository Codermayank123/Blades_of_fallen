import { useRef, useEffect, useCallback } from 'react';

export function useGameLoop(callback, isRunning = true) {
    const frameRef = useRef();
    const previousTimeRef = useRef();
    const callbackRef = useRef(callback);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const loop = useCallback((time) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;
            callbackRef.current(deltaTime, time);
        }
        previousTimeRef.current = time;
        frameRef.current = requestAnimationFrame(loop);
    }, []);

    useEffect(() => {
        if (isRunning) {
            frameRef.current = requestAnimationFrame(loop);
        }

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [isRunning, loop]);
}
