import { SynthesisParameters } from '../audio/api/types';

export interface NoteEvent {
    tuning: number;
    id: string;
    note: number;
    timestamp: number;
    velocity: number;
    duration: number;
    synthesis: SynthesisParameters;
} 