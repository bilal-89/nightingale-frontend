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
                                                            isLocalDragging,
                                                            style,
                                                            onMouseDown,
                                                            onClick,
                                                            onKeyDown
                                                        }) => {
    const baseOpacity = note.velocity / 127;
    const attackTime = note.synthesis?.envelope?.attack ?? 0.05;
    const tuning = note.synthesis?.tuning ?? 0;

    return (
        <div
            className={`absolute rounded-lg transition-all duration-75 cursor-move select-none
                ${isSelected ? 'ring-2 ring-blue-400 z-10' : ''}
                ${isLocalDragging ? 'scale-[1.02] z-20' : ''}
                hover:brightness-105`}
            style={{
                left: `${style.left}px`,
                top: `${style.top}px`,
                width: `${Math.max(4, style.width)}px`,
                height: `${LAYOUT.NOTE_HEIGHT}px`,
                background: getAttackGradient({ trackColor, baseOpacity, attackTime }),
                transform: 'translateZ(0)',
                transition: isLocalDragging ? 'none' : 'top 0.1s ease-out',
                boxShadow: getNoteBoxShadow(isSelected, isLocalDragging)
            }}
            onMouseDown={onMouseDown}
            onClick={onClick}
            onKeyDown={onKeyDown}
            tabIndex={isSelected ? 0 : -1}
            title={`Note ${note.velocity} (${style.width.toFixed(0)}ms), Tuning: ${tuning}¢`}
        />
    );
};