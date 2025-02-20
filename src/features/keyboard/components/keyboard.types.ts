// src/features/keyboard/types/keyboard.arrangement.types.ts
import { NoteColor } from '../../../shared/constants/colors';

export interface KeyProps {
    note: number;
    isPressed: boolean;
    tuning: number;
    onNoteOn: (note: number) => void;
    onNoteOff: (note: number) => void;
    onTuningChange: (note: number, cents: number) => void;
    trackColor?: NoteColor;  // Add the trackColor prop

}

export interface NoteInfo {
    note: number;
    noteName: string;
    frequency: number;
}

export type NoteNames = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';