import { Parameter } from '../types/types';

export const parameters: Parameter[] = [
    // Note parameters
    {
        id: 'tuning',
        name: 'Tuning',
        min: -100,
        max: 100,
        step: 1,
        unit: 'cents',
        defaultValue: 0,
        contexts: ['keyboard', 'note'],
        group: 'note'
    },
    {
        id: 'velocity',
        name: 'Velocity',
        min: 0,
        max: 127,
        step: 1,
        defaultValue: 100,
        contexts: ['keyboard', 'note'],
        group: 'note'
    },
    {
        id: 'microTiming',
        name: 'Micro-timing',
        min: -50,
        max: 50,
        step: 1,
        unit: 'ms',
        defaultValue: 0,
        contexts: ['note'],
        // extraControls: true,
        group: 'note'
    },
    // ADSR Envelope parameters
    {
        id: 'attack',
        name: 'Attack',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 50,
        contexts: ['keyboard', 'note'],
        group: 'envelope'
    },
    {
        id: 'decay',
        name: 'Decay',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 100,
        contexts: ['keyboard', 'note'],
        group: 'envelope'
    },
    {
        id: 'sustain',
        name: 'Sustain',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        defaultValue: 70,
        contexts: ['keyboard', 'note'],
        group: 'envelope'
    },
    {
        id: 'release',
        name: 'Release',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 150,
        contexts: ['keyboard', 'note'],
        group: 'envelope'
    },
    // Filter parameters
    {
        id: 'filterCutoff',
        name: 'Filter Cutoff',
        min: 20,
        max: 20000,
        step: 1,
        unit: 'Hz',
        defaultValue: 20000,
        contexts: ['keyboard', 'note'],
        group: 'filter'
    },
    {
        id: 'filterResonance',
        name: 'Resonance',
        min: 0,
        max: 20,
        step: 0.1,
        unit: 'Q',
        defaultValue: 0.707,
        contexts: ['keyboard', 'note'],
        group: 'filter'
    }
];