import { SynthesisParameters } from '../audio/types/audioTypes.ts';

export interface NoteEvent {
    tuning: number;
    id: string;
    note: number;
    timestamp: number;
    velocity: number;
    duration: number;
    synthesis: SynthesisParameters;
} 