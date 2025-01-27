import { SynthesisParameters } from '../../../audio/types/audioTypes';

// src/features/player/types/note.ts

export interface NoteEvent {
    id: string;
    note: number;
    timestamp: number;  // Now in ticks
    tickPosition: number;  // Add this for clarity
    velocity: number;
    duration: number;  // Now in ticks
    synthesis: SynthesisParameters;
}

export interface NoteModification {
    pitch?: number;
    velocity?: number;
    duration?: number;
    synthesis?: Partial<SynthesisParameters>;
}
