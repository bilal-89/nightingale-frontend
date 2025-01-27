import { NoteEvent } from './note';

export interface Clip {
    id: string;
    startCell: number;
    length: number;
    track: number;
    isSelected: boolean;
    notes: NoteEvent[];
    parameters: ClipParameters;
}

export interface ClipParameters {
    velocity: number;
    pitch: number;
    tuning: number;
}
