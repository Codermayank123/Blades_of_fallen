import { useEffect, useRef, useCallback } from 'react';

const KEY_MAP = {
    'KeyA': 'left',
    'KeyD': 'right',
    'KeyW': 'jump',
    'Space': 'attack'
};

export function useInputHandler(send, isPlaying) {
    const inputStateRef = useRef({
        left: false,
        right: false,
        jump: false,
        attack: false
    });
    const seqRef = useRef(0);
    const lastSentRef = useRef(null);
    const attackCooldownRef = useRef(false);

    const sendInput = useCallback(() => {
        if (!isPlaying) return;

        const current = { ...inputStateRef.current };

        const input = {
            type: 'INPUT',
            seq: seqRef.current++,
            tick: Date.now(),
            inputs: current
        };

        send(input);
        lastSentRef.current = { ...current };
    }, [send, isPlaying]);

    useEffect(() => {
        if (!isPlaying) return;

        const handleKeyDown = (e) => {
            // Prevent default for game keys
            if (KEY_MAP[e.code]) {
                e.preventDefault();
            }

            const action = KEY_MAP[e.code];
            if (!action) return;

            if (action === 'attack') {
                // Attack is a one-shot action with cooldown
                if (!attackCooldownRef.current) {
                    inputStateRef.current.attack = true;
                    attackCooldownRef.current = true;
                    sendInput();

                    // Reset attack flag after sending
                    setTimeout(() => {
                        inputStateRef.current.attack = false;
                    }, 50);

                    // Cooldown before next attack
                    setTimeout(() => {
                        attackCooldownRef.current = false;
                    }, 800); // Match server cooldown
                }
            } else if (action === 'jump') {
                // Jump is also one-shot
                if (!inputStateRef.current.jump) {
                    inputStateRef.current.jump = true;
                    sendInput();
                    // Reset after a short delay
                    setTimeout(() => {
                        inputStateRef.current.jump = false;
                    }, 100);
                }
            } else {
                // Movement keys are held
                if (!inputStateRef.current[action]) {
                    inputStateRef.current[action] = true;
                    sendInput();
                }
            }
        };

        const handleKeyUp = (e) => {
            const action = KEY_MAP[e.code];
            if (action && (action === 'left' || action === 'right')) {
                inputStateRef.current[action] = false;
                sendInput();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPlaying, sendInput]);

    return inputStateRef;
}
