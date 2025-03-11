// Add debugging to the parameter service
// import { parameters } from '../constants/parameters';
import { parameters } from '../constants/parameters';

import { Parameter } from '../types/types';

export class ParameterService {
    // Get parameter definition by ID
    getDefinition(parameterId: string): Parameter | undefined {
        return parameters.find(p => p.id === parameterId);
    }

    // Convert display value to internal value
    convertToInternal(parameterId: string, displayValue: number): number {
        console.log(`Converting ${parameterId} from ${displayValue} to internal value`);
        
        // Add specific handling for unison parameters
        if (parameterId.startsWith('unison')) {
            // No conversion needed for unison parameters
            console.log(`Unison parameter ${parameterId}: ${displayValue}`);
            return displayValue;
        }
        
        // Handle envelope parameters
        if (['attack', 'decay', 'release'].includes(parameterId)) {
            // Convert from milliseconds to seconds
            return displayValue / 1000;
        }
        
        if (parameterId === 'sustain') {
            // Convert from percentage to 0-1 range
            return displayValue / 100;
        }
        
        // Handle filter parameters
        if (parameterId === 'filterCutoff') {
            return displayValue;
        }
        
        if (parameterId === 'filterResonance') {
            return displayValue;
        }
        
        // Default: no conversion
        return displayValue;
    }
    
    // Convert internal value to display value
    convertToDisplay(parameterId: string, internalValue: number): number {
        // Handle envelope parameters
        if (['attack', 'decay', 'release'].includes(parameterId)) {
            // Convert from seconds to milliseconds
            return internalValue * 1000;
        }
        
        if (parameterId === 'sustain') {
            // Convert from 0-1 range to percentage
            return internalValue * 100;
        }
        
        // Default: no conversion
        return internalValue;
    }

    // Get parameters by group
    getParametersByGroup(group: string): Parameter[] {
        return parameters.filter(p => p.group === group);
    }
} 