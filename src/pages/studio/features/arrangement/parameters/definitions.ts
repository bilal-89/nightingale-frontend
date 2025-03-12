// src/features/player/parameters/definitions.ts

import { ParameterDefinition } from './types';

export const PARAMETER_DEFINITIONS: ParameterDefinition[] = [
    {
        id: 'attack',
        name: 'Attack',
        group: 'envelope',
        range: {
            min: 0,
            max: 1,
            step: 0.001,
            defaultValue: 0.05
        },
        display: {
            unit: 'ms',
            scale: 1000,
            precision: 0
        }
    },
    {
        id: 'decay',
        name: 'Decay',
        group: 'envelope',
        range: {
            min: 0,
            max: 1,
            step: 0.001,
            defaultValue: 0.1
        },
        display: {
            unit: 'ms',
            scale: 1000,
            precision: 0
        }
    },
    {
        id: 'sustain',
        name: 'Sustain',
        group: 'envelope',
        range: {
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: 0.7
        },
        display: {
            unit: '%',
            scale: 100,
            precision: 0
        }
    },
    {
        id: 'release',
        name: 'Release',
        group: 'envelope',
        range: {
            min: 0,
            max: 1,
            step: 0.001,
            defaultValue: 0.15
        },
        display: {
            unit: 'ms',
            scale: 1000,
            precision: 0
        }
    },
    {
        id: 'velocity',
        name: 'Velocity',
        group: 'note',
        range: {
            min: 0,
            max: 1,
            step: 0.01,
            defaultValue: 0.8
        },
        display: {
            scale: 127,
            precision: 0
        }
    },
    {
        id: 'tuning',
        name: 'Fine Tuning',
        group: 'note',
        range: {
            min: -100,  // -100 cents
            max: 100,   // +100 cents
            step: 1,    // 1 cent steps
            defaultValue: 0
        },
        display: {
            unit: 'cents',
            scale: 1,    // No scaling needed since we're working directly in cents
            precision: 0
        }
    }
];