// src/audio/constants/drumSounds.ts
import { DrumSound } from '../types/drumTypes';

export const drumSounds: Record<number, DrumSound> = {
    60: { type: '808_low', baseFreq: 60, label: '808', color: '#ece4e4' },
    61: { type: '808_mid', baseFreq: 80, label: '808', color: '#ece4e4' },
    62: { type: 'hihat_closed', baseFreq: 2000, label: 'HH', color: '#ece4e4' },
    63: { type: 'hihat_open', baseFreq: 2000, label: 'OH', color: '#ece4e4' },
    64: { type: 'rimshot', baseFreq: 1000, label: 'Rim', color: '#ece4e4' },
    65: { type: 'crash', baseFreq: 3000, label: 'Crash', color: '#ece4e4' },
    66: { type: 'conga_low', baseFreq: 200, label: 'Conga', color: '#ece4e4' },
    67: { type: 'conga_mid', baseFreq: 300, label: 'Conga', color: '#ece4e4' },
    68: { type: 'conga_high', baseFreq: 400, label: 'Conga', color: '#ece4e4' },
    69: { type: 'bongo_low', baseFreq: 500, label: 'Bongo', color: '#ece4e4' },
    70: { type: 'bongo_high', baseFreq: 600, label: 'Bongo', color: '#ece4e4' },
    71: { type: 'cowbell', baseFreq: 800, label: 'Bell', color: '#ece4e4' }
};