import { useState, useEffect } from 'react';

/**
 * Hook to enforce landscape orientation on mobile devices.
 * - Attempts screen.orientation.lock('landscape')
 * - Attempts fullscreen for orientation lock support
 * - Tracks portrait vs landscape state
 * - Cleans up on unmount
 *
 * @returns {{ isPortrait: boolean }}
 */
export default function useLandscapeLock() {
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const lockLandscape = async () => {
            try {
                if (screen.orientation && screen.orientation.lock) {
                    await screen.orientation.lock('landscape');
                }
            } catch (e) {
                // Orientation lock not supported or not in fullscreen
            }
        };

        const isMobile =
            'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (isMobile) {
            lockLandscape();
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen()
                    .then(() => lockLandscape())
                    .catch(() => {});
            }
        }

        const checkOrientation = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
            if (screen.orientation && screen.orientation.unlock) {
                try { screen.orientation.unlock(); } catch (_) {}
            }
            if (document.fullscreenElement) {
                try { document.exitFullscreen(); } catch (_) {}
            }
        };
    }, []);

    return { isPortrait };
}
