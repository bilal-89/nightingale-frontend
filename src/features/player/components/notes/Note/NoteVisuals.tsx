// src/features/player/components/notes/Note/NoteVisuals.tsx

import React from 'react';
import { LAYOUT } from '../../../constants';
import { getAttackGradient, getNoteBoxShadow } from './NoteGradients';
import { NoteStyleProps } from './types';

interface NoteVisualsProps {
    note: {
        velocity: number;
        synthesis?: {
            envelope?: {
                attack: number;
            };
            tuning?: number;
        };
    };
    trackColor: string;
    isSelected: boolean;
    isMultiSelected?: boolean;
    isFocused?: boolean;
    isLocalDragging: boolean;
    style: NoteStyleProps;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const NoteVisuals: React.FC<NoteVisualsProps> = ({
                                                            note,
                                                            trackColor,
                                                            isSelected,
                                                            isMultiSelected,
                                                            isFocused,
                                                            isLocalDragging,
                                                            style,
                                                            onMouseDown,
                                                            onClick,
                                                            onKeyDown
                                                        }) => {
    const baseOpacity = note.velocity / 127;
    const attackTime = note.synthesis?.envelope?.attack ?? 0.05;
    const tuning = note.synthesis?.tuning ?? 0;

    // Enhanced selection styling
    const getSelectionClasses = () => {
        if (isFocused) return 'ring-2 ring-blue-400 z-20';
        if (isMultiSelected) return 'ring-2 ring-blue-300 z-10';
        if (isSelected) return 'ring-2 ring-blue-200 z-10';
        return '';
    };

    return (
        <div
            className={`absolute rounded-lg transition-all duration-75 cursor-move select-none
                ${getSelectionClasses()}
                ${isLocalDragging ? 'scale-[1.02] z-30' : ''}
                hover:brightness-105`}
            style={{
                left: `${style.left}px`,
                top: `${style.top}px`,
                width: `${Math.max(4, style.width)}px`,
                height: `${LAYOUT.NOTE_HEIGHT}px`,
                background: getAttackGradient({ trackColor, baseOpacity, attackTime }),
                transform: 'translateZ(0)',
                transition: isLocalDragging ? 'none' : 'top 0.1s ease-out',
                boxShadow: getNoteBoxShadow(isSelected || isMultiSelected || isFocused, isLocalDragging)
            }}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={isSelected || isFocused ? 0 : -1}
            title={`Note ${note.velocity} (${style.width.toFixed(0)}ms), Tuning: ${tuning}¢`}
        />
    );
};