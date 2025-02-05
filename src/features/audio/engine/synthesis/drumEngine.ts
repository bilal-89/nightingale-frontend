// src/features/audio/engine/synthesis/drumEngine.ts

import { DrumType, DrumVoice, DRUM_SOUNDS } from '../../types';

interface SynthesisResult {
    nodes: AudioNode[];
    duration: number;
}

export class DrumEngine {
    private context: AudioContext;
    private voices: Map<string, DrumVoice>;
    private mainGain: GainNode;
    private isInitialized: boolean = false;

    constructor(context: AudioContext) {
        this.context = context;
        this.voices = new Map();
        this.mainGain = this.context.createGain();
        this.mainGain.gain.value = 0.7;
        this.mainGain.connect(this.context.destination);
        this.isInitialized = true;
    }

    createVoice(note: number, time: number = 0, tuning = 0): DrumVoice {
        if (!DRUM_SOUNDS[note]) {
            throw new Error(`No drum sound found for note ${note}`);
        }

        // Get current time plus a tiny offset to ensure immediate playback
        const startTime = this.context.currentTime;
        const sound = DRUM_SOUNDS[note];
        const synthesizer = this.getSynthesizer(sound.type);
        const { nodes, duration } = synthesizer(sound.baseFreq, tuning, startTime);

        const voice: DrumVoice = {
            id: crypto.randomUUID(),
            type: sound.type,
            nodes,
            startTime,
            duration
        };

        this.voices.set(voice.id, voice);
        this.scheduleCleanup(voice);

        return voice;
    }

    private scheduleCleanup(voice: DrumVoice): void {
        const cleanupTime = (voice.duration + 0.1) * 1000;
        setTimeout(() => {
            voice.nodes.forEach(node => node.disconnect());
            this.voices.delete(voice.id);
        }, cleanupTime);
    }

    private getSynthesizer(type: DrumType): (freq: number, tuning: number, time: number) => SynthesisResult {
        const synthMap: Record<DrumType, (freq: number, tuning: number, time: number) => SynthesisResult> = {
            '808_low': this.create808.bind(this),
            '808_mid': this.create808.bind(this),
            'hihat_closed': (freq, tuning, time) => this.createHiHat(false, freq, tuning, time),
            'hihat_open': (freq, tuning, time) => this.createHiHat(true, freq, tuning, time),
            'rimshot': this.createRimshot.bind(this),
            'crash': this.createCrash.bind(this),
            'conga_low': this.createConga.bind(this),
            'conga_mid': this.createConga.bind(this),
            'conga_high': this.createConga.bind(this),
            'bongo_low': this.createConga.bind(this),
            'bongo_high': this.createConga.bind(this),
            'cowbell': this.createCowbell.bind(this)
        };

        return synthMap[type];
    }

    private create808(frequency: number, tuning: number, time: number): SynthesisResult {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const duration = 0.5;

        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        oscillator.type = 'triangle';
        oscillator.frequency.value = tunedFreq * 2;
        oscillator.frequency.exponentialRampToValueAtTime(tunedFreq, time + 0.05);

        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain);
        oscillator.start(time);
        oscillator.stop(time + duration);

        return { nodes: [oscillator, gainNode], duration };
    }

    private createHiHat(isOpen: boolean, frequency: number, tuning: number, time: number): SynthesisResult {
        const duration = isOpen ? 0.2 : 0.05;
        const { noise, filter, gainNode } = this.createNoiseWithFilter(duration);
        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        filter.frequency.value = tunedFreq;
        filter.Q.value = 5;

        gainNode.gain.value = 0.3;
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

        noise.start(time);
        noise.stop(time + duration);

        return { nodes: [noise, filter, gainNode], duration };
    }

    private createRimshot(frequency: number, tuning: number, time: number): SynthesisResult {
        const duration = 0.05;
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        oscillator.frequency.value = tunedFreq;
        oscillator.type = 'square';

        gainNode.gain.value = 0.5;
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain);
        oscillator.start(time);
        oscillator.stop(time + duration);

        return { nodes: [oscillator, gainNode], duration };
    }

    private createCrash(frequency: number, tuning: number, time: number): SynthesisResult {
        const duration = 1.0;
        const { noise, filter, gainNode } = this.createNoiseWithFilter(duration);
        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        filter.frequency.value = tunedFreq;
        filter.Q.value = 3;

        gainNode.gain.value = 0.3;
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

        noise.start(time);
        noise.stop(time + duration);

        return { nodes: [noise, filter, gainNode], duration };
    }

    private createConga(frequency: number, tuning: number, time: number): SynthesisResult {
        const duration = 0.2;
        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.frequency.value = tunedFreq;
        oscillator.type = 'sine';

        gainNode.gain.value = 0.7;
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.mainGain);
        oscillator.start(time);
        oscillator.stop(time + duration);

        return { nodes: [oscillator, gainNode], duration };
    }

    private createCowbell(frequency: number, tuning: number, time: number): SynthesisResult {
        const duration = 0.3;
        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        const osc1 = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const gainNode = this.context.createGain();

        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.value = tunedFreq;
        osc2.frequency.value = tunedFreq * 1.5;

        gainNode.gain.value = 0.5;
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.mainGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + duration);
        osc2.stop(time + duration);

        return { nodes: [osc1, osc2, gainNode], duration };
    }

    private getTunedFrequency(baseFreq: number, tuning: number): number {
        return baseFreq * Math.pow(2, tuning / 1200);
    }

    private createNoiseWithFilter(duration: number) {
        const bufferSize = this.context.sampleRate * duration;
        const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';

        const gainNode = this.context.createGain();

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.mainGain);

        return { noise, filter, gainNode };
    }

    cleanup(): void {
        this.voices.forEach(voice => {
            voice.nodes.forEach(node => {
                try {
                    node.disconnect();
                } catch (error) {
                    console.error('Error disconnecting node:', error);
                }
            });
        });
        this.voices.clear();

        try {
            this.mainGain.disconnect();
        } catch (error) {
            console.error('Error disconnecting main gain:', error);
        }
        this.mainGain = this.context.createGain();
        this.mainGain.connect(this.context.destination);
    }
}