// src/audio/context/drums/drumSoundManager.ts

// These type definitions help us manage our different drum sounds
type DrumType = '808_low' | '808_mid' | 'hihat_closed' | 'hihat_open' | 'rimshot' | 'crash' |
    'conga_low' | 'conga_mid' | 'conga_high' | 'bongo_low' | 'bongo_high' | 'cowbell';

interface DrumSound {
    type: DrumType;
    baseFreq: number;
    label: string;
    color: string;
}

// Our drum sound mapping remains the same
export const drumSounds: Record<number, DrumSound> = {
    60: { type: '808_low', baseFreq: 60, label: '808', color: '#ece4e4' },
    61: { type: '808_mid', baseFreq: 80, label: '808', color: '#ece4e4' },
    62: { type: 'hihat_closed', baseFreq: 2000, label: 'HH', color: '#ece4e4' },
    63: { type: 'hihat_open', baseFreq: 2000, label: 'OH', color: '#ece4e4' },
    64: { type: 'rimshot', baseFreq: 1000, label: 'Rim', color: '#ece4e4' },
    65: { type: 'crash', baseFreq: 3000, label: 'Crash', color: '#ece4e4' },
    66: { type: 'conga_low', baseFreq: 200, label: 'Conga', color: '#ece4e4' },
    67: { type: 'conga_mid', baseFreq: 300, label: 'Conga', color: '#ece4e4' },
    68: { type: 'conga_high', baseFreq: 400, label: 'Conga', color: '#ece4e4' },
    69: { type: 'bongo_low', baseFreq: 500, label: 'Bongo', color: '#ece4e4' },
    70: { type: 'bongo_high', baseFreq: 600, label: 'Bongo', color: '#ece4e4' },
    71: { type: 'cowbell', baseFreq: 800, label: 'Bell', color: '#ece4e4' }
};

export class DrumSoundManager {
    private context: AudioContext | null = null;

    constructor() {
        this.context = null;
    }

    // Allow external access to check the context
    getContext(): AudioContext | null {
        return this.context;
    }

    initialize() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this;
    }

    // New method for scheduled playback
    playDrumSoundAt(note: number, time: number, tuning: number = 0) {
        if (!this.context) this.initialize();
        const sound = drumSounds[note];
        if (!sound) return;

        // Calculate the time offset from now
        const timeOffset = Math.max(0, time - this.context!.currentTime);

        switch (sound.type) {
            case '808_low':
            case '808_mid':
                this.create808Scheduled(sound.baseFreq, tuning, 0.5, time);
                break;
            case 'hihat_closed':
                this.createHiHatScheduled(false, tuning, time);
                break;
            case 'hihat_open':
                this.createHiHatScheduled(true, tuning, time);
                break;
            case 'rimshot':
                this.createRimshotScheduled(tuning, time);
                break;
            case 'crash':
                this.createCrashScheduled(tuning, time);
                break;
            case 'conga_low':
            case 'conga_mid':
            case 'conga_high':
            case 'bongo_low':
            case 'bongo_high':
            case 'cowbell':
                this.createCongaScheduled(sound.baseFreq, tuning, time);
                break;
        }
    }

    // Original methods for immediate playback
    playDrumSound(note: number, tuning: number = 0) {
        if (!this.context) this.initialize();
        const sound = drumSounds[note];
        if (!sound) return;

        // Play the sound immediately using current time
        const now = this.context!.currentTime;
        this.playDrumSoundAt(note, now, tuning);
    }

    // Scheduled versions of our synthesis methods
    private create808Scheduled(frequency: number, tuning: number = 0, duration: number = 0.5, startTime: number) {
        if (!this.context) return;

        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const tunedFrequency = frequency * tuningMultiplier;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.setValueAtTime(tunedFrequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            tunedFrequency * 0.01,
            startTime + 0.15
        );

        gainNode.gain.setValueAtTime(1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        // Clean up after playback
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, (startTime + duration + 0.1 - this.context.currentTime) * 1000);
    }

    private createHiHatScheduled(isOpen: boolean, tuning: number = 0, startTime: number) {
        if (!this.context) return;

        const duration = isOpen ? 0.2 : 0.05;
        const bufferSize = this.context.sampleRate * duration;
        const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);

        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;

        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const baseFreq = 2000 * tuningMultiplier;

        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = baseFreq;
        filter.Q.value = 5;

        const gainNode = this.context.createGain();

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        noise.start(startTime);
        noise.stop(startTime + duration);

        setTimeout(() => {
            noise.disconnect();
            filter.disconnect();
            gainNode.disconnect();
        }, (startTime + duration + 0.1 - this.context.currentTime) * 1000);
    }

    private createRimshotScheduled(tuning: number = 0, startTime: number) {
        if (!this.context) return;

        const duration = 0.05;
        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const baseFreq = 1000 * tuningMultiplier;

        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();

        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);

        setTimeout(() => {
            osc.disconnect();
            gainNode.disconnect();
        }, (startTime + duration + 0.1 - this.context.currentTime) * 1000);
    }

    private createCrashScheduled(tuning: number = 0, startTime: number) {
        if (!this.context) return;

        const duration = 0.5;
        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const baseFreq = 3000 * tuningMultiplier;

        const bufferSize = this.context.sampleRate * duration;
        const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);

        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = baseFreq;
        filter.Q.value = 3;

        const gainNode = this.context.createGain();

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        noise.start(startTime);
        noise.stop(startTime + duration);

        setTimeout(() => {
            noise.disconnect();
            filter.disconnect();
            gainNode.disconnect();
        }, (startTime + duration + 0.1 - this.context.currentTime) * 1000);
    }

    private createCongaScheduled(frequency: number, tuning: number = 0, startTime: number) {
        if (!this.context) return;

        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const tunedFrequency = frequency * tuningMultiplier;

        // Main oscillator
        const mainOsc = this.context.createOscillator();
        const mainGain = this.context.createGain();
        mainOsc.frequency.setValueAtTime(tunedFrequency, startTime);
        mainOsc.connect(mainGain);
        mainGain.connect(this.context.destination);

        // Second oscillator (harmonics)
        const secondOsc = this.context.createOscillator();
        const secondGain = this.context.createGain();
        secondOsc.frequency.setValueAtTime(tunedFrequency * 1.5, startTime);
        secondOsc.connect(secondGain);
        secondGain.connect(this.context.destination);

        // Noise component for attack
        const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.1, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = this.context.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = tunedFrequency * 2;
        noiseFilter.Q.value = 2;

        const noiseGain = this.context.createGain();
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.context.destination);

        // Envelope shaping
        mainGain.gain.setValueAtTime(0.7, startTime);
        mainGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        secondGain.gain.setValueAtTime(0.3, startTime);
        secondGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        noiseGain.gain.setValueAtTime(0.2, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

        // Start and schedule stop
        mainOsc.start(startTime);
        mainOsc.stop(startTime + 0.2);
        secondOsc.start(startTime);
        secondOsc.stop(startTime + 0.15);
        noise.start(startTime);
        noise.stop(startTime + 0.05);

        // Clean up after playback
        setTimeout(() => {
            mainOsc.disconnect();
            secondOsc.disconnect();
            noise.disconnect();
            mainGain.disconnect();
            secondGain.disconnect();
            noiseGain.disconnect();
            noiseFilter.disconnect();
        }, (startTime + 0.2 + 0.1 - this.context.currentTime) * 1000);
    }
}

export const drumSoundManager = new DrumSoundManager();