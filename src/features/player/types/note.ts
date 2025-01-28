import { SynthesisParameters } from '../../../audio/types/audioTypes';

// src/features/player/types/note.ts

// In your types.ts
export interface NoteEvent {
    id: string;
    timestamp: number;
    duration: number;
    note: number;
    velocity: number;
    tuning?: number; // Optional but will be normalized to 0 in selector
    synthesis: {
        envelope: {
            attack: number;
            decay: number;
            sustain: number;
            release: number;
        };
    };
}
export interface NoteModification {
    pitch?: number;
    velocity?: number;
    duration?: number;
    synthesis?: Partial<SynthesisParameters>;
}
