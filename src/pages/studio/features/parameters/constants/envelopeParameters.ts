import { Parameter } from '../types/types';

export const envelopeParameters: Parameter[] = [
    {
        id: 'attack',
        name: 'Attack',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 50,
        contexts: ['keyboard', 'note'],
        group: 'envelope',
        precision: 0
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
        group: 'envelope',
        precision: 0
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
        group: 'envelope',
        precision: 0
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
        group: 'envelope',
        precision: 0
    }
]; 