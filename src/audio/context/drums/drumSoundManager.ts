type DrumType = '808_low' | '808_mid' | 'hihat_closed' | 'hihat_open' | 'rimshot' | 'crash' |
    'conga_low' | 'conga_mid' | 'conga_high' | 'bongo_low' | 'bongo_high' | 'cowbell';

interface DrumSound {
    type: DrumType;
    baseFreq: number;
    label: string;
    color: string;
}

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

    initialize() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this;
    }

    create808(frequency: number, tuning: number = 0, duration: number = 0.5) {
        if (!this.context) return;

        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const tunedFrequency = frequency * tuningMultiplier;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const now = this.context.currentTime;

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.setValueAtTime(tunedFrequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(
            tunedFrequency * 0.01,
            now + 0.15
        );

        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    createHiHat(isOpen: boolean, tuning: number = 0) {
        if (!this.context) return;

        const bufferSize = this.context.sampleRate * (isOpen ? 0.2 : 0.05);
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
        const now = this.context.currentTime;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + (isOpen ? 0.2 : 0.05));

        noise.start(now);
        noise.stop(now + (isOpen ? 0.2 : 0.05));
    }

    createRimshot(tuning: number = 0) {
        if (!this.context) return;

        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const baseFreq = 1000 * tuningMultiplier;

        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const now = this.context.currentTime;

        osc.frequency.setValueAtTime(baseFreq, now);
        osc.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    createCrash(tuning: number = 0) {
        if (!this.context) return;

        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const baseFreq = 3000 * tuningMultiplier;

        const bufferSize = this.context.sampleRate * 0.5;
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
        const now = this.context.currentTime;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        noise.start(now);
        noise.stop(now + 0.5);
    }

    createConga(frequency: number, tuning: number = 0) {
        if (!this.context) return;

        const tuningMultiplier = Math.pow(2, tuning / 1200);
        const tunedFrequency = frequency * tuningMultiplier;
        const now = this.context.currentTime;

        // Main oscillator
        const mainOsc = this.context.createOscillator();
        const mainGain = this.context.createGain();
        mainOsc.frequency.setValueAtTime(tunedFrequency, now);
        mainOsc.connect(mainGain);
        mainGain.connect(this.context.destination);

        // Second oscillator (harmonics)
        const secondOsc = this.context.createOscillator();
        const secondGain = this.context.createGain();
        secondOsc.frequency.setValueAtTime(tunedFrequency * 1.5, now);
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
        mainGain.gain.setValueAtTime(0.7, now);
        mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        secondGain.gain.setValueAtTime(0.3, now);
        secondGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        // Start and stop all components
        mainOsc.start(now);
        mainOsc.stop(now + 0.2);
        secondOsc.start(now);
        secondOsc.stop(now + 0.15);
        noise.start(now);
        noise.stop(now + 0.05);
    }

    playDrumSound(note: number, tuning: number = 0) {
        const sound = drumSounds[note];
        if (!sound) return;

        switch (sound.type) {
            case '808_low':
            case '808_mid':
                this.create808(sound.baseFreq, tuning);
                break;
            case 'hihat_closed':
                this.createHiHat(false, tuning);
                break;
            case 'hihat_open':
                this.createHiHat(true, tuning);
                break;
            case 'rimshot':
                this.createRimshot(tuning);
                break;
            case 'crash':
                this.createCrash(tuning);
                break;
            case 'conga_low':
            case 'conga_mid':
            case 'conga_high':
            case 'bongo_low':
            case 'bongo_high':
                this.createConga(sound.baseFreq, tuning);
                break;
            case 'cowbell':
                this.createConga(sound.baseFreq, tuning); // For now using conga sound for cowbell
                break;
        }
    }
}

export const drumSoundManager = new DrumSoundManager();