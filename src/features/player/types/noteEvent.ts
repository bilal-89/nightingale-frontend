import { SynthesisParameters } from './synthesisParameters';

export interface NoteEvent {
    id: string;
    note: number;
    timestamp: number;
    duration: number;
    velocity: number;
    tuning?: number;
    synthesis?: SynthesisParameters;
}

export interface CompleteNoteEvent extends NoteEvent {
    synthesis: SynthesisParameters;
} 