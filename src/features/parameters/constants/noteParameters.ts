import { Parameter } from '../types/types';

export const noteParameters: Parameter[] = [
    {
        id: 'tuning',
        name: 'Tuning',
        min: -100,
        max: 100,
        step: 1,
        unit: 'cents',
        defaultValue: 0,
        contexts: ['keyboard', 'note'],
        group: 'note',
        precision: 0
    },
    {
        id: 'velocity',
        name: 'Velocity',
        min: 0,
        max: 127,
        step: 1,
        defaultValue: 100,
        contexts: ['keyboard', 'note'],
        group: 'note',
        precision: 0
    }
]; 