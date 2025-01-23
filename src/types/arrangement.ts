// src/types/arrangement.ts

export interface NoteEvent {
    note: number;
    timestamp: number;
    velocity: number;
    duration?: number;
    synthesis?: {
        [key: string]: any;  // Replace with specific synthesis parameters
    };
}

export interface ClipParameters {
    velocity: number;
    pitch: number;
    tuning: number;
}

export interface Clip {
    id: string;
    startCell: number;
    length: number;
    track: number;
    isSelected: boolean;
    notes: NoteEvent[];
    parameters: ClipParameters;
}

export interface ArrangementState {
    isRecording: boolean;
    recordingStartTime: number | null;
    recordingBuffer: NoteEvent[];
    currentTrack: number;
    tempo: number;
    clips: Clip[];
}