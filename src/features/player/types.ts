import { SynthesisParameters } from '../audio/api/types';
import { NoteColor } from '../../shared/constants/colors';

export interface NoteEvent {
    tuning: number;
    id: string;
    note: number;
    timestamp: number;
    velocity: number;
    duration: number;
    synthesis: SynthesisParameters;
    color?: NoteColor;
    isActive?: boolean;
} 