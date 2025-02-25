// src/features/shared/constants/colors.ts

export enum NoteColor {
    Brown = '#9e4206',    // Brown
    Red = '#bd0000',      // Red
    Orange = '#ff6a1b',   // Orange
    Green = '#9fc102',    // Green
    Blue = '#297dff',     // Blue
    Purple = '#9332f6',   // Purple
    Magenta = '#ff4f9e'   // Magenta
}

export const ColorOptions = Object.values(NoteColor);

// Get color with velocity-based opacity
export function getColorWithOpacity(color: string, velocity: number): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${velocity})`;
}

// Get a lighter version of a color for hover/pressed states
export function getLighterColor(color: string): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const lighterR = Math.min(255, r + 20);
    const lighterG = Math.min(255, g + 20);
    const lighterB = Math.min(255, b + 20);

    return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
}

// Get note gradient based on attack time and velocity
export function getNoteGradient(color: string, velocity: number, attackTime: number = 0.05): string {
    const baseColor = getColorWithOpacity(color, velocity);
    const endColor = getColorWithOpacity(color, velocity * 0.8);
    const midPoint = Math.min(100, attackTime * 1000);

    return `linear-gradient(90deg, 
        ${baseColor} 0%, 
        ${baseColor} ${midPoint}%, 
        ${endColor} 100%
    )`;
}

// Get next color in sequence for new tracks
export function getNextColor(currentColor: NoteColor): NoteColor {
    const currentIndex = ColorOptions.indexOf(currentColor);
    const nextIndex = (currentIndex + 1) % ColorOptions.length;
    return ColorOptions[nextIndex];
}