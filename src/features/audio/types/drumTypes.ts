// src/audio/types/drumTypes.ts

export type DrumType =
    | '808_low'
    | '808_mid'
    | 'hihat_closed'
    | 'hihat_open'
    | 'rimshot'
    | 'crash'
    | 'conga_low'
    | 'conga_mid'
    | 'conga_high'
    | 'bongo_low'
    | 'bongo_high'
    | 'cowbell';

export interface DrumSound {
    type: DrumType;
    baseFreq: number;
    label: string;
    color: string;
}