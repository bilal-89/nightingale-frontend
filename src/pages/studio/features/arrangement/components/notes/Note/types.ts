// src/features/player/components/notes/Note/types.ts

import { NoteEvent } from '../../../../../../../features/player/types';

export interface NoteProps {
    note: NoteEvent;
    trackId: string;
    trackIndex: number;
    isSelected: boolean;
    isMultiSelected?: boolean;
    isFocused?: boolean;
    timelineZoom: number;
    availableTracks: string[];
    lowestNote: number;
    highestNote: number;
    trackColor: string;
    verticalPosition: number;  // Add this

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

export interface NoteGradientProps {
    trackColor: string;
    baseOpacity: number;
    attackTime: number;
}

export interface NoteVisualsProps {
    note: NoteEvent;
    trackColor: string;
    isSelected: boolean;
    isMultiSelected?: boolean;
    isFocused?: boolean;
    isLocalDragging: boolean;
    style: NoteStyleProps;
    draggable: boolean;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrag?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
}