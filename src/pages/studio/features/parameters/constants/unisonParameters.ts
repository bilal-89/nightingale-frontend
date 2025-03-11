import { Parameter } from '../types/types';

export const unisonParameters: Parameter[] = [
    {
        id: 'unisonCount',
        name: 'Unison Count',
        min: 1,
        max: 8,
        step: 1,
        defaultValue: 1,
        contexts: ['keyboard', 'note'],
        group: 'unison'
    },
    {
        id: 'unisonDetune',
        name: 'Detune',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 10,
        contexts: ['keyboard', 'note'],
        group: 'unison'
    },
    {
        id: 'unisonWidth',
        name: 'Width',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        contexts: ['keyboard', 'note'],
        group: 'unison'
    }
]; 