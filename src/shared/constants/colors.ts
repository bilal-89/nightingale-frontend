// src/features/shared/constants/colors.ts

export enum NoteColor {
    Brown = '#b39b8e',    // Muted brown
    Red = '#d8a9a7',      // Muted red
    Orange = '#d8b9a2',   // Muted orange
    Green = '#b5d16b',    // Keyboard green (matches the container)
    Blue = '#a7c1d8',     // Muted blue
    Purple = '#b8b9d1',   // Muted purple
    Magenta = '#d1a7c1'   // Muted magenta
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

// NEW: Get a muted version of a color for UI elements
export function getMutedColor(color: string, opacity: number = 0.8): string {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Mix with white to create a more pastel version
    const mixedR = Math.round(r * opacity + 255 * (1 - opacity));
    const mixedG = Math.round(g * opacity + 255 * (1 - opacity));
    const mixedB = Math.round(b * opacity + 255 * (1 - opacity));
    
    return `#${mixedR.toString(16).padStart(2, '0')}${mixedG.toString(16).padStart(2, '0')}${mixedB.toString(16).padStart(2, '0')}`;
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