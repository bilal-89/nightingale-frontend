import { Parameter } from '../types/types';

export const filterParameters: Parameter[] = [
    {
        id: 'filterCutoff',
        name: 'Filter Cutoff',
        min: 20,
        max: 20000,
        step: 1,
        unit: 'Hz',
        defaultValue: 19000,
        contexts: ['keyboard', 'note'],
        group: 'filter',
        precision: 0
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
        group: 'filter',
        precision: 1
    }
]; 