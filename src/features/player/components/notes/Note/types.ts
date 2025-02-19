// src/features/player/components/notes/Note/types.ts

import { NoteEvent } from '../../../types';

export interface NoteProps {
    note: NoteEvent;
    trackId: string;
    trackIndex: number;
    isSelected: boolean;
    isMultiSelected?: boolean;  // New prop for multi-select state
    isFocused?: boolean;       // New prop for single-select focus
    timelineZoom: number;
    availableTracks: string[];
    lowestNote: number;
    highestNote: number;
    trackColor: string;
}

export interface NoteStyleProps {
    left: number;
    top: number;
    width: number;
    height: number;
    background: string;
    isSelected: boolean;
    isMultiSelected?: boolean;
    isFocused?: boolean;
    isDragging: boolean;
}

// Keep existing NoteGradientProps
export interface NoteGradientProps {
    trackColor: string;
    baseOpacity: number;
    attackTime: number;
}