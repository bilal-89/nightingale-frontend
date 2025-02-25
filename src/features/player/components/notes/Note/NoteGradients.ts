// src/features/player/components/notes/Note/NoteGradients.ts

import { NoteGradientProps } from './types';

export function getAttackGradient({ trackColor, baseOpacity, attackTime }: NoteGradientProps): string {
    const maxAttackPercent = 25;
    const attackPercent = Math.min(attackTime * 100 * 2, maxAttackPercent);
    const opacityHex = Math.round(baseOpacity * 255).toString(16).padStart(2, '0');

    return `linear-gradient(90deg, 
        ${trackColor}00 0%,
        ${trackColor}${opacityHex} ${attackPercent}%,
        ${trackColor}${opacityHex} 100%)
    `;
}

export function getNoteBoxShadow(isSelected: boolean, isDragging: boolean): string {
    if (isSelected || isDragging) {
        return 'inset 2px 2px 3px rgba(0, 0, 0, 0.2), inset -1px -1px 2px rgba(255, 255, 255, 0.3)';
    }
    return '2px 2px 3px rgba(0, 0, 0, 0.2), -1px -1px 2px rgba(255, 255, 255, 0.3), inset 1px 1px 1px rgba(255, 255, 255, 0.1)';
}