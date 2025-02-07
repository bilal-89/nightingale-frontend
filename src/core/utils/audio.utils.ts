import { AudioConfiguration } from "../types/audio";
import { AUDIO_CONFIG } from "../config/constants";

export function createAudioContext(config: Partial<AudioConfiguration> = {}): AudioContext {
    // Create an audio context with default or custom settings
    return new AudioContext({
        sampleRate: config.sampleRate ?? AUDIO_CONFIG.DEFAULT_SAMPLE_RATE,
        latencyHint: config.latencyHint ?? AUDIO_CONFIG.DEFAULT_LATENCY,
    });
}

export function frequencyFromMIDINote(note: number): number {
    // Convert MIDI note numbers to actual frequencies in Hz
    // Note: A4 (note 69) = 440Hz
    return 440 * Math.pow(2, (note - 69) / 12);
}
