import { BirdsongParameters } from './types';

export class BirdsongAudioManager {
    private context: AudioContext | null = null;
    private activeVoices: Map<number, any> = new Map();

    constructor() {
        this.context = null;
    }

    initialize() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this;
    }

    createBirdsongVoice(note: number, params: BirdsongParameters) {
        if (!this.context) return null;

        const baseFreq = 440 * Math.pow(2, (note - 69) / 12);

        // Primary oscillator (syrinx membrane)
        const osc1 = this.context.createOscillator();
        const osc2 = this.context.createOscillator();

        // Gain nodes
        const osc1Gain = this.context.createGain();
        const osc2Gain = this.context.createGain();
        const mainGain = this.context.createGain();

        // Noise for breath simulation
        const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.1, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;

        const noiseFilter = this.context.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = baseFreq * 2;
        noiseFilter.Q.value = 1;

        const noiseGain = this.context.createGain();
        noiseGain.gain.value = params.turbulence * 0.2;

        // Set frequencies and connect nodes
        osc1.frequency.value = baseFreq;
        osc2.frequency.value = baseFreq * (1 + params.syrinxTension * 0.02);

        osc1.connect(osc1Gain);
        osc2.connect(osc2Gain);
        osc1Gain.connect(mainGain);
        osc2Gain.connect(mainGain);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(mainGain);

        mainGain.connect(this.context.destination);

        // Set initial gains
        osc1Gain.gain.value = 0.5 * params.airPressure;
        osc2Gain.gain.value = 0.3 * params.airPressure;
        mainGain.gain.value = 0;

        // Start sound
        osc1.start();
        osc2.start();
        noise.start();

        mainGain.gain.linearRampToValueAtTime(0.3 * params.airPressure, this.context.currentTime + 0.05);

        const voice = {
            oscillators: [osc1, osc2],
            gains: [osc1Gain, osc2Gain, mainGain, noiseGain],
            noise
        };

        this.activeVoices.set(note, voice);
        return voice;
    }

    stopNote(note: number) {
        const voice = this.activeVoices.get(note);
        if (voice && this.context) {
            voice.gains[2].gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);

            setTimeout(() => {
                voice.oscillators.forEach((osc: OscillatorNode) => osc.stop());
                voice.noise.stop();
                this.activeVoices.delete(note);
            }, 150);
        }
    }

    updateParameters(note: number, params: BirdsongParameters) {
        const voice = this.activeVoices.get(note);
        if (voice && this.context) {
            const baseFreq = 440 * Math.pow(2, (note - 69) / 12);
            voice.oscillators[1].frequency.value = baseFreq * (1 + params.syrinxTension * 0.02);
            voice.gains[0].gain.value = 0.5 * params.airPressure;
            voice.gains[1].gain.value = 0.3 * params.airPressure;
            voice.gains[3].gain.value = params.turbulence * 0.2;
        }
    }

    cleanup() {
        this.activeVoices.forEach((voice, note) => this.stopNote(note));
        this.activeVoices.clear();
    }
}

export const birdsongAudioManager = new BirdsongAudioManager();