import { NoteEvent } from './note';

export interface InspectorPosition {
    x: number;
    y: number;
}

export interface NoteSelection {
    clipId: string;
    noteIndex: number;
}

export interface NoteUpdatePayload {
    clipId: string;
    noteIndex: number;
    updates: Partial<NoteEvent>;
}
