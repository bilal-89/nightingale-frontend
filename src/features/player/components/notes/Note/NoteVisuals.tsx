// src/features/player/components/notes/Note/NoteVisuals.tsx

import React from 'react';
import { LAYOUT } from '../../../constants';
import { getAttackGradient, getNoteBoxShadow } from './NoteGradients';
import { NoteStyleProps } from './types';

interface NoteVisualsProps {
    note: {
        id: string;  // Ensure note has an id property
        velocity: number;
        synthesis?: {
            envelope?: {
                attack: number;
            };
            tuning?: number;
        };
    };
    trackId: string;  // Add trackId to props
    trackColor: string;
    isSelected: boolean;
    isMultiSelected?: boolean;
    isFocused?: boolean;
    isLocalDragging: boolean;
    style: NoteStyleProps;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    draggable: boolean;
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrag: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const NoteVisuals: React.FC<NoteVisualsProps> = ({
                                                            note,
                                                            trackId,
                                                            trackColor,
                                                            isSelected,
                                                            isMultiSelected,
                                                            isFocused,
                                                            isLocalDragging,
                                                            style,
                                                            onMouseDown,
                                                            onClick,
                                                            onKeyDown,
                                                            draggable,
                                                            onDragStart,
                                                            onDrag,
                                                            onDragEnd
                                                        }) => {
    const baseOpacity = note.velocity / 127;
    const attackTime = note.synthesis?.envelope?.attack ?? 0.05;
    const tuning = note.synthesis?.tuning ?? 0;

    // Enhanced selection styling with more distinct states
    const getSelectionClasses = () => {
        const baseClasses = 'note absolute rounded-md transition-shadow duration-75 cursor-move select-none';

        if (isLocalDragging) {
            return `${baseClasses} scale-[1.02] z-30 ring-2 ring-blue-400 shadow-lg`;
        }
        if (isFocused) {
            return `${baseClasses} z-20 ring-2 ring-blue-400 shadow-md`;
        }
        if (isMultiSelected) {
            return `${baseClasses} z-10 ring-2 ring-blue-300 shadow-sm`;
        }
        if (isSelected) {
            return `${baseClasses} z-10 ring-2 ring-blue-200 shadow-sm`;
        }
        return `${baseClasses} hover:brightness-105 shadow-none`;
    };

    return (
        <div
            className={getSelectionClasses()}
            data-note-id={note.id}  // Add data attribute for selection box
            data-track-id={trackId} // Add data attribute for selection box
            style={{
                left: `${style.left}px`,
                top: `${style.top}px`,
                width: `${Math.max(4, style.width)}px`,
                height: `${LAYOUT.NOTE_HEIGHT}px`,
                background: getAttackGradient({ trackColor, baseOpacity, attackTime }),
                transform: 'translateZ(0)',
                transition: 'all 0.1s ease-out',
                boxShadow: isSelected || isMultiSelected || isFocused ?
                    'inset 1px 1px 1px rgba(255,255,255,0.3), inset -1px -1px 1px rgba(0,0,0,0.2)' :
                    'none',
                cursor: 'move'
            }}
            draggable={draggable}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={isSelected || isFocused ? 0 : -1}
            title={`Note ${note.velocity} (${style.width.toFixed(0)}ms), Tuning: ${tuning}¢`}
        />
    );
};