import { SynthesisParameters } from '../../audio/types/audioTypes';

export interface NoteEvent {
    id: string;
    note: number;
    timestamp: number;
    velocity: number;
    duration: number;
    synthesis: SynthesisParameters;
} 