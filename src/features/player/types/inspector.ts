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

// src/features/player/types/inspector.ts

export interface NoteParameters {
    syrinxTension: number;
    warbleRate: number;
    warbleDepth: number;
    airNoise: number;
}

export interface NoteUpdatePayload {
    clipId: string;
    noteIndex: number;
    parameters: Partial<NoteParameters & {
        velocity: number;
        pitch: number;
        tuning: number;
    }>;
}
