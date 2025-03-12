import { SynthesisParameters } from '../../../pages/studio/features/oscillators/api/types';
import { NoteColor } from '../../../shared/constants/colors';

// src/features/player/types/note.ts
export interface NoteEvent {
    id: string;
    timestamp: number;        // Already in ms, perfect!
    duration: number;         // Already in ms, perfect!
    note: number;
    velocity: number;
    tuning?: number;
    synthesis: {
        envelope: {
            attack: number;
            decay: number;
            sustain: number;
            release: number;
        };
        waveform?: string;
        unison?: {
            count: number;
            detune: number;
            width: number;
        };
        effects?: {
            filter?: {
                type: string;
                frequency: number;
                Q: number;
            };
        };
    };
    color?: NoteColor;

    // New optional properties for timing expression
    quantizeOffset?: number;  // How far note was moved by quantization
    originalTime?: number;    // Pre-quantized time for reference
}

export interface NoteModification {
    pitch?: number;
    velocity?: number;
    duration?: number;
    synthesis?: Partial<SynthesisParameters>;
}

export interface NoteParameterUpdate {
    clipId: string;
    noteIndex: number;
    parameters: NoteEvent;
}