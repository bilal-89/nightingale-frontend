import { SynthesisParameters } from '../../oscillators/api/types.ts';
import { NoteColor } from '../../../../../shared/constants/colors.ts';

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