// src/audio/managers/drumManager.ts

import { DrumType } from '../../api/types';
import { drumSounds } from '../../constants/drumSounds';


export class DrumSoundManager {
    private context: AudioContext | null = null;

    constructor() {
        this.context = null;
    }

    public getContext(): AudioContext | null {
        return this.context;
    }

    initialize(): this {
        if (!this.context) {
            // Instead of checking for webkitAudioContext, we can simply use AudioContext
            // Modern browsers all support this standard version
            this.context = new AudioContext();
        }
        return this;
    }

    public playDrumSoundAt(note: number, time: number, tuning = 0): void {
        if (!this.context) this.initialize();
        const sound = drumSounds[note];
        if (!sound) return;

        const synthesizer = this.getSynthesizer(sound.type);
        synthesizer(sound.baseFreq, tuning, time);
    }

    public playDrumSound(note: number, tuning = 0): void {
        if (!this.context) this.initialize();
        const now = this.context!.currentTime;
        this.playDrumSoundAt(note, now, tuning);
    }

    private getSynthesizer(type: DrumType): (freq: number, tuning: number, time: number) => void {
        const synthMap: Record<DrumType, (freq: number, tuning: number, time: number) => void> = {
            '808_low': this.create808Scheduled.bind(this),
            '808_mid': this.create808Scheduled.bind(this),
            'hihat_closed': (_freq, tuning, time) => this.createHiHatScheduled(false, tuning, time),
            'hihat_open': (_freq, tuning, time) => this.createHiHatScheduled(true, tuning, time),
            'rimshot': this.createRimshotScheduled.bind(this),
            'crash': this.createCrashScheduled.bind(this),
            'conga_low': this.createCongaScheduled.bind(this),
            'conga_mid': this.createCongaScheduled.bind(this),
            'conga_high': this.createCongaScheduled.bind(this),
            'bongo_low': this.createCongaScheduled.bind(this),
            'bongo_high': this.createCongaScheduled.bind(this),
            'cowbell': this.createCongaScheduled.bind(this)
        };

        return synthMap[type];
    }

    private create808Scheduled(frequency: number, tuning = 0, startTime: number): void {
        if (!this.context) return;

        const duration = 0.5;
        const { oscillator, gainNode } = this.createOscillatorWithGain();
        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(tunedFreq * 2, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            tunedFreq,
            startTime + 0.15
        );

        gainNode.gain.setValueAtTime(1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        this.schedulePlayback(oscillator, startTime, duration, [oscillator, gainNode]);
    }

    private createHiHatScheduled(isOpen: boolean, tuning = 0, startTime: number): void {
        if (!this.context) return;

        const duration = isOpen ? 0.2 : 0.05;
        const { noise, filter, gainNode } = this.createNoiseWithFilter(duration);
        const baseFreq = this.getTunedFrequency(2000, tuning);

        filter.frequency.value = baseFreq;
        filter.Q.value = 5;

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        this.schedulePlayback(noise, startTime, duration, [noise, filter, gainNode]);
    }

    private createRimshotScheduled(frequency: number, tuning = 0, startTime: number): void {
        if (!this.context) return;

        const duration = 0.05;
        const { oscillator, gainNode } = this.createOscillatorWithGain();
        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        oscillator.frequency.setValueAtTime(tunedFreq, startTime);
        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        this.schedulePlayback(oscillator, startTime, duration, [oscillator, gainNode]);
    }

    private createCrashScheduled(frequency: number, tuning = 0, startTime: number): void {
        if (!this.context) return;

        const duration = 0.5;
        const { noise, filter, gainNode } = this.createNoiseWithFilter(duration);
        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        filter.frequency.value = tunedFreq;
        filter.Q.value = 3;

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        this.schedulePlayback(noise, startTime, duration, [noise, filter, gainNode]);
    }

    private createCongaScheduled(frequency: number, tuning = 0, startTime: number): void {
        if (!this.context) return;

        const tunedFreq = this.getTunedFrequency(frequency, tuning);

        // Main oscillator setup
        const { oscillator: mainOsc, gainNode: mainGain } = this.createOscillatorWithGain();
        mainOsc.frequency.setValueAtTime(tunedFreq, startTime);
        mainGain.gain.setValueAtTime(0.7, startTime);
        mainGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        // Harmonic oscillator setup
        const { oscillator: harmOsc, gainNode: harmGain } = this.createOscillatorWithGain();
        harmOsc.frequency.setValueAtTime(tunedFreq * 1.5, startTime);
        harmGain.gain.setValueAtTime(0.3, startTime);
        harmGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        // Attack noise setup
        const { noise, filter, gainNode: noiseGain } = this.createNoiseWithFilter(0.1);
        filter.frequency.value = tunedFreq * 2;
        filter.Q.value = 2;
        noiseGain.gain.setValueAtTime(0.2, startTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);

        // Schedule all components
        this.schedulePlayback(mainOsc, startTime, 0.2, [mainOsc, mainGain]);
        this.schedulePlayback(harmOsc, startTime, 0.15, [harmOsc, harmGain]);
        this.schedulePlayback(noise, startTime, 0.05, [noise, filter, noiseGain]);
    }

    private getTunedFrequency(baseFreq: number, tuning: number): number {
        const tuningMultiplier = Math.pow(2, tuning / 1200);
        return baseFreq * tuningMultiplier;
    }

    private createOscillatorWithGain(): { oscillator: OscillatorNode; gainNode: GainNode } {
        const oscillator = this.context!.createOscillator();
        const gainNode = this.context!.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.context!.destination);
        return { oscillator, gainNode };
    }

    private createNoiseWithFilter(duration: number): {
        noise: AudioBufferSourceNode;
        filter: BiquadFilterNode;
        gainNode: GainNode
    } {
        const bufferSize = this.context!.sampleRate * duration;
        const noiseBuffer = this.context!.createBuffer(1, bufferSize, this.context!.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);

        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = this.context!.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.context!.createBiquadFilter();
        filter.type = 'bandpass';

        const gainNode = this.context!.createGain();

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.context!.destination);

        return { noise, filter, gainNode };
    }

    private schedulePlayback(
        source: AudioScheduledSourceNode,
        startTime: number,
        duration: number,
        nodesToCleanup: AudioNode[]
    ): void {
        source.start(startTime);
        source.stop(startTime + duration);

        const cleanupTime = (startTime + duration + 0.1 - this.context!.currentTime) * 1000;
        setTimeout(() => {
            nodesToCleanup.forEach(node => node.disconnect());
        }, cleanupTime);
    }
}

export const drumSoundManager = new DrumSoundManager();