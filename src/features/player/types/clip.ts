import { NoteEvent } from './note';

export interface Clip {
    id: string;
    startTime: number;    // Changed from startCell
    duration: number;     // Changed from length
    track: number;
    notes: NoteEvent[];
    isSelected?: boolean;
    selectedNoteIndex?: number;  // Added this
    parameters: ClipParameters;
}

export interface ClipParameters {
    velocity: number;
    pitch: number;
    tuning: number;
}
