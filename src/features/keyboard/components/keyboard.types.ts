import { NoteColor } from '../../../shared/constants/colors';

export interface KeyProps {
    note: number;
    isPressed: boolean;
    tuning: number;
    onNoteOn: (note: number) => void;
    onNoteOff: (note: number) => void;
    onTuningChange: (note: number, cents: number) => void;
    trackColor?: NoteColor;
    mode?: SynthMode;
    onPanelClick?: () => void;
    isPanelVisible?: boolean;
}

export interface NoteInfo {
    note: number;
    noteName: string;
    frequency: number;
}

export type NoteNames = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface OctaveControlsProps {
    className?: string;
}

export type SynthMode = 'tunable' | 'drums';

export interface OctaveState {
    currentOctave: number;
    minOctave: number;
    maxOctave: number;
}

export const DEFAULT_OCTAVE_STATE: OctaveState = {
    currentOctave: 4,
    minOctave: 0,
    maxOctave: 8
};