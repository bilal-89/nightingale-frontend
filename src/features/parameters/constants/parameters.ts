import { Parameter } from '../types/types';
import { envelopeParameters } from './envelopeParameters';
import { filterParameters } from './filterParameters';
import { unisonParameters } from './unisonParameters';
import { noteParameters } from './noteParameters';

// Combine all parameter groups
export const parameters: Parameter[] = [
    ...noteParameters,
    ...envelopeParameters,
    ...filterParameters,
    ...unisonParameters
    // Add other parameter groups as needed
];