// src/features/player/constants.ts

export const LAYOUT = {
    TRACK_HEIGHT: 96,
    NOTE_HEIGHT: 12,
    VERTICAL_MARGIN: 8,
    MIN_CLIP_LENGTH: 1
};

export const TIMELINE = {
    DEFAULT_TEMPO: 120,
    MS_PER_BEAT: (tempo: number) => 60000 / tempo,
    BEATS_PER_CELL: 1/4
};

// If we want to keep CONSTANTS from the Clip component for now
export const CLIP_CONSTANTS = {
    CELL_WIDTH: 48,
};