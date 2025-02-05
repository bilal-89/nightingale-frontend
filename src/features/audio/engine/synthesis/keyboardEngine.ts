import { Voice, VoiceParams, EnvelopeParams, FilterParams, Waveform } from '../../types';

export class KeyboardEngine {
    private readonly DEFAULT_FILTER_CUTOFF = 20000;  // Hz
    private readonly DEFAULT_FILTER_RESONANCE = 0.707;  // Q value
    private readonly DEFAULT_GAIN = 0.3;

    private context: AudioContext;
    private mainGain: GainNode;
    private voices: Map<string, Voice>;

    constructor(context: AudioContext) {
        this.context = context;
        this.mainGain = this.context.createGain();
        this.mainGain.connect(this.context.destination);
        this.voices = new Map();
    }

    createVoice(params: VoiceParams): Voice {
        const now = this.context.currentTime;

        // Create audio nodes
        const oscillator = this.context.createOscillator();
        const filterNode = this.context.createBiquadFilter();
        const gainNode = this.context.createGain();

        // Calculate initial frequency with tuning
        const baseFrequency = this.noteToFrequency(params.note);
        const initialFrequency = params.tuning ?
            this.applyTuning(baseFrequency, params.tuning) :
            baseFrequency;

        // Configure oscillator
        oscillator.type = params.waveform;
        oscillator.frequency.setValueAtTime(initialFrequency, now);

        // Configure filter
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(params.filter.cutoff, now);
        filterNode.Q.setValueAtTime(params.filter.resonance, now);

        // Configure envelope
        const maxGain = this.velocityToGain(params.velocity);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxGain, now + params.envelope.attack);
        gainNode.gain.linearRampToValueAtTime(
            maxGain * params.envelope.sustain,
            now + params.envelope.attack + params.envelope.decay
        );

        // Connect audio path
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.mainGain);
        oscillator.start(now);

        // Create voice object
        const voice: Voice = {
            id: crypto.randomUUID(),
            oscillator,
            filterNode,
            gainNode,
            baseFrequency,
            currentTuning: params.tuning || 0,
            currentVelocity: params.velocity,
            startTime: now,
            noteStartTime: now,
            envelope: params.envelope,
            waveform: params.waveform,
            filter: params.filter
        };

        this.voices.set(voice.id, voice);
        return voice;
    }

    updateVoice(id: string, params: Partial<VoiceParams>): void {
        const voice = this.voices.get(id);
        if (!voice) return;

        const now = this.context.currentTime;

        // Handle tuning updates
        if (params.tuning !== undefined) {
            const newFreq = this.applyTuning(voice.baseFrequency, params.tuning);
            voice.oscillator.frequency.linearRampToValueAtTime(newFreq, now + 0.01);
            voice.currentTuning = params.tuning;
        } else if (params.note !== undefined) {
            // If note changes, update base frequency and apply current tuning
            const newBaseFreq = this.noteToFrequency(params.note);
            const newFreq = this.applyTuning(newBaseFreq, voice.currentTuning);
            voice.oscillator.frequency.linearRampToValueAtTime(newFreq, now + 0.01);
            voice.baseFrequency = newBaseFreq;
        }

        // Update other parameters
        if (params.waveform) {
            voice.oscillator.type = params.waveform;
            voice.waveform = params.waveform;
        }

        if (params.filter) {
            voice.filterNode.frequency.linearRampToValueAtTime(params.filter.cutoff, now + 0.01);
            voice.filterNode.Q.linearRampToValueAtTime(params.filter.resonance, now + 0.01);
            voice.filter = params.filter;
        }

        if (params.velocity !== undefined) {
            const newGain = this.velocityToGain(params.velocity);
            voice.gainNode.gain.linearRampToValueAtTime(newGain * voice.envelope.sustain, now + 0.02);
            voice.currentVelocity = params.velocity;
        }

        if (params.envelope) {
            voice.envelope = params.envelope;
        }
    }

    releaseVoice(id: string): void {
        const voice = this.voices.get(id);
        if (!voice) return;

        const now = this.context.currentTime;
        const releaseTime = voice.envelope.release;

        // Start release phase
        voice.gainNode.gain.cancelScheduledValues(now);
        voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
        voice.gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);

        // Schedule cleanup
        setTimeout(() => {
            voice.oscillator.stop(now + releaseTime + 0.1);
            voice.oscillator.disconnect();
            voice.filterNode.disconnect();
            voice.gainNode.disconnect();
            this.voices.delete(id);
        }, releaseTime * 1000 + 200);
    }

    private noteToFrequency(note: number): number {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    private applyTuning(baseFrequency: number, cents: number): number {
        return baseFrequency * Math.pow(2, cents / 1200);
    }

    private velocityToGain(velocity: number): number {
        const normalizedVelocity = velocity / 127;
        return Math.pow(normalizedVelocity, 3) * this.DEFAULT_GAIN;
    }

    cleanup(): void {
        this.voices.forEach((_voice, id) => this.releaseVoice(id));
        this.voices.clear();
    }
}