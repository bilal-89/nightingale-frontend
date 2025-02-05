export interface AudioConfiguration {
    sampleRate: number;
    latencyHint: AudioContextLatencyCategory;
}

export interface VoiceParameters {
    frequency: number;
    velocity: number;
    duration?: number;
}

export interface SynthVoice {
    id: string;
    note: number;
    frequency: number;
    velocity: number;
    startTime: number;
    releaseTime?: number;
}
