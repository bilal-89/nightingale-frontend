// src/audio/managers/drumManager.ts

import { DrumType } from '../../api/types';
import { drumSounds } from '../../constants/drumSounds';

interface DrumParameters {
    tuning?: number;      // cents
    velocity?: number;    // 0-127
    attack?: number;      // ms
    decay?: number;       // ms
    sustain?: number;     // 0-1
    release?: number;     // ms
    filterCutoff?: number;    // Hz
    filterResonance?: number; // Q value
}

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
            this.context = new AudioContext();
        }
        return this;
    }

    public playDrumSoundAt(note: number, time: number, params: DrumParameters = {}): void {
        if (!this.context) this.initialize();
        const sound = drumSounds[note];
        if (!sound) return;

        const synthesizer = this.getSynthesizer(sound.type);
        synthesizer(sound.baseFreq, params, time);
    }

    public playDrumSound(note: number, params: DrumParameters = {}): void {
        if (!this.context) this.initialize();
        const now = this.context!.currentTime;
        this.playDrumSoundAt(note, now, params);
    }

    private getSynthesizer(type: DrumType): (freq: number, params: DrumParameters, time: number) => void {
        const synthMap: Record<DrumType, (freq: number, params: DrumParameters, time: number) => void> = {
            '808_low': this.create808Scheduled.bind(this),
            '808_mid': this.create808Scheduled.bind(this),
            'hihat_closed': (_freq, params, time) => this.createHiHatScheduled(false, params, time),
            'hihat_open': (_freq, params, time) => this.createHiHatScheduled(true, params, time),
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

    private create808Scheduled(frequency: number, params: DrumParameters = {}, startTime: number): void {
        if (!this.context) return;

        const duration = (params.attack || 0) + (params.decay || 500) + (params.release || 100);
        const { oscillator, gainNode, filter } = this.createOscillatorWithGainAndFilter();
        const tunedFreq = this.getTunedFrequency(frequency, params.tuning || 0);
        const velocity = (params.velocity !== undefined ? params.velocity : 100) / 127;

        // Apply filter if provided
        if (params.filterCutoff || params.filterResonance) {
            filter.frequency.value = params.filterCutoff || 19000;
            filter.Q.value = params.filterResonance || 0.707;
            oscillator.connect(filter);
            filter.connect(gainNode);
        } else {
            oscillator.connect(gainNode);
        }

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(tunedFreq * 2, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            tunedFreq,
            startTime + (params.attack || 0) / 1000
        );

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + (params.attack || 0) / 1000);
        gainNode.gain.linearRampToValueAtTime(
            velocity * (params.sustain || 0.1),
            startTime + ((params.attack || 0) + (params.decay || 500)) / 1000
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration / 1000
        );

        this.schedulePlayback(oscillator, startTime, duration / 1000, [oscillator, gainNode, filter]);
    }

    private createHiHatScheduled(isOpen: boolean, params: DrumParameters = {}, startTime: number): void {
        if (!this.context) return;

        const duration = (params.attack || 0) + (params.decay || (isOpen ? 200 : 50)) + (params.release || 100);
        const { noise, filter, gainNode } = this.createNoiseWithFilter(duration / 1000);
        const velocity = (params.velocity !== undefined ? params.velocity : 100) / 127;

        // Apply filter parameters
        filter.frequency.value = params.filterCutoff || 2000;
        filter.Q.value = params.filterResonance || 5;

        if (params.tuning) {
            filter.frequency.value = this.getTunedFrequency(filter.frequency.value, params.tuning);
        }

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.3, startTime + (params.attack || 0) / 1000);
        gainNode.gain.linearRampToValueAtTime(
            velocity * 0.3 * (params.sustain || 0.1),
            startTime + ((params.attack || 0) + (params.decay || (isOpen ? 200 : 50))) / 1000
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration / 1000
        );

        this.schedulePlayback(noise, startTime, duration / 1000, [noise, filter, gainNode]);
    }

    private createRimshotScheduled(frequency: number, params: DrumParameters = {}, startTime: number): void {
        if (!this.context) return;

        const duration = (params.attack || 0) + (params.decay || 50) + (params.release || 50);
        const { oscillator, gainNode, filter } = this.createOscillatorWithGainAndFilter();
        const tunedFreq = this.getTunedFrequency(frequency, params.tuning || 0);
        const velocity = (params.velocity !== undefined ? params.velocity : 100) / 127;

        if (params.filterCutoff || params.filterResonance) {
            filter.frequency.value = params.filterCutoff || 20000;
            filter.Q.value = params.filterResonance || 0.707;
            oscillator.connect(filter);
            filter.connect(gainNode);
        } else {
            oscillator.connect(gainNode);
        }

        oscillator.frequency.setValueAtTime(tunedFreq, startTime);

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.5, startTime + (params.attack || 0) / 1000);
        gainNode.gain.linearRampToValueAtTime(
            velocity * 0.5 * (params.sustain || 0.1),
            startTime + ((params.attack || 0) + (params.decay || 50)) / 1000
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration / 1000
        );

        this.schedulePlayback(oscillator, startTime, duration / 1000, [oscillator, gainNode, filter]);
    }

    private createCrashScheduled(frequency: number, params: DrumParameters = {}, startTime: number): void {
        if (!this.context) return;

        const duration = (params.attack || 0) + (params.decay || 500) + (params.release || 500);
        const { noise, filter, gainNode } = this.createNoiseWithFilter(duration / 1000);
        const tunedFreq = this.getTunedFrequency(frequency, params.tuning || 0);
        const velocity = (params.velocity !== undefined ? params.velocity : 100) / 127;

        filter.frequency.value = params.filterCutoff || tunedFreq;
        filter.Q.value = params.filterResonance || 3;

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity * 0.3, startTime + (params.attack || 0) / 1000);
        gainNode.gain.linearRampToValueAtTime(
            velocity * 0.3 * (params.sustain || 0.1),
            startTime + ((params.attack || 0) + (params.decay || 500)) / 1000
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration / 1000
        );

        this.schedulePlayback(noise, startTime, duration / 1000, [noise, filter, gainNode]);
    }

    private createCongaScheduled(frequency: number, params: DrumParameters = {}, startTime: number): void {
        if (!this.context) return;

        const tunedFreq = this.getTunedFrequency(frequency, params.tuning || 0);
        const duration = (params.attack || 0) + (params.decay || 200) + (params.release || 100);
        const velocity = (params.velocity !== undefined ? params.velocity : 100) / 127;

        // Main oscillator setup
        const { oscillator: mainOsc, gainNode: mainGain, filter: mainFilter } = this.createOscillatorWithGainAndFilter();
        if (params.filterCutoff || params.filterResonance) {
            mainFilter.frequency.value = params.filterCutoff || 20000;
            mainFilter.Q.value = params.filterResonance || 0.707;
            mainOsc.connect(mainFilter);
            mainFilter.connect(mainGain);
        } else {
            mainOsc.connect(mainGain);
        }

        mainOsc.frequency.setValueAtTime(tunedFreq, startTime);

        // ADSR envelope
        mainGain.gain.setValueAtTime(0, startTime);
        mainGain.gain.linearRampToValueAtTime(velocity * 0.7, startTime + (params.attack || 0) / 1000);
        mainGain.gain.linearRampToValueAtTime(
            velocity * 0.7 * (params.sustain || 0.1),
            startTime + ((params.attack || 0) + (params.decay || 200)) / 1000
        );
        mainGain.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration / 1000
        );

        this.schedulePlayback(mainOsc, startTime, duration / 1000, [mainOsc, mainGain, mainFilter]);
    }

    private getTunedFrequency(baseFreq: number, tuning: number): number {
        const tuningMultiplier = Math.pow(2, tuning / 1200);
        return baseFreq * tuningMultiplier;
    }

    private createOscillatorWithGainAndFilter(): {
        oscillator: OscillatorNode;
        gainNode: GainNode;
        filter: BiquadFilterNode;
    } {
        const oscillator = this.context!.createOscillator();
        const gainNode = this.context!.createGain();
        const filter = this.context!.createBiquadFilter();
        filter.type = 'lowpass';
        gainNode.connect(this.context!.destination);
        return { oscillator, gainNode, filter };
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
        gainNode.connect(this.context!.destination);

        noise.connect(filter);
        filter.connect(gainNode);

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