// Audio Manager - Singleton for game audio using Web Audio API
class AudioManager {
    constructor() {
        this.ctx = null;
        this.sounds = new Map();
        this.musicSource = null;
        this.musicGain = null;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.3;
        this.muted = false;
        this.loaded = false;
    }

    // Initialize audio context (must be called after user interaction)
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Handle tab visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseMusic();
            } else {
                this.resumeMusic();
            }
        });
    }

    // Preload all game sounds
    async preload() {
        if (this.loaded) return;
        this.init();

        const soundFiles = {
            attack: '/audio/attackw.mp3',
            hit: '/audio/hurt.wav',
            jump: '/audio/jump.wav',
            death: '/audio/death.mp3',
            victory: '/audio/success.wav',
            bgm: '/audio/background.mp3'
        };

        const loadPromises = Object.entries(soundFiles).map(async ([name, path]) => {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.sounds.set(name, audioBuffer);
                console.log(`Loaded audio: ${name}`);
            } catch (e) {
                console.warn(`Failed to load audio: ${name}`, e);
            }
        });

        await Promise.all(loadPromises);
        this.loaded = true;
        console.log('All audio loaded');
    }

    // Play a sound effect (low latency)
    playSFX(name) {
        if (this.muted || !this.ctx) return;

        const buffer = this.sounds.get(name);
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = this.sfxVolume;

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
    }

    // Play background music (looping)
    playMusic() {
        if (this.muted || !this.ctx) return;

        // Stop existing music
        this.stopMusic();

        const buffer = this.sounds.get('bgm');
        if (!buffer) return;

        this.musicSource = this.ctx.createBufferSource();
        this.musicSource.buffer = buffer;
        this.musicSource.loop = true;

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVolume;

        this.musicSource.connect(this.musicGain);
        this.musicGain.connect(this.ctx.destination);
        this.musicSource.start(0);
    }

    stopMusic() {
        if (this.musicSource) {
            try {
                this.musicSource.stop();
            } catch (e) { }
            this.musicSource = null;
        }
    }

    pauseMusic() {
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }

    resumeMusic() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Volume controls
    setSFXVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
    }

    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        }
        return this.muted;
    }

    setMuted(muted) {
        this.muted = muted;
        if (muted) {
            this.stopMusic();
        }
    }
}

// Singleton instance
export const audioManager = new AudioManager();
