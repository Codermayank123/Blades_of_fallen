import { useEffect, useCallback } from 'react';
import { audioManager } from '../audio/AudioManager';

// Hook to use audio in components
export function useAudio() {
    // Initialize audio on first user interaction
    useEffect(() => {
        const initAudio = async () => {
            await audioManager.preload();
        };

        const handleInteraction = () => {
            initAudio();
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    const playSFX = useCallback((name) => {
        audioManager.playSFX(name);
    }, []);

    const playMusic = useCallback(() => {
        audioManager.playMusic();
    }, []);

    const stopMusic = useCallback(() => {
        audioManager.stopMusic();
    }, []);

    const setSFXVolume = useCallback((vol) => {
        audioManager.setSFXVolume(vol);
    }, []);

    const setMusicVolume = useCallback((vol) => {
        audioManager.setMusicVolume(vol);
    }, []);

    const toggleMute = useCallback(() => {
        return audioManager.toggleMute();
    }, []);

    return {
        playSFX,
        playMusic,
        stopMusic,
        setSFXVolume,
        setMusicVolume,
        toggleMute,
        audioManager
    };
}
