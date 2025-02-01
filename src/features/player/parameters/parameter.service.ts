// src/features/player/parameters/parameter.service.ts

import { ParameterDefinition, ParameterValue } from './types';
import { PARAMETER_DEFINITIONS } from './definitions';
import { NoteEvent } from '../types';

/**
 * The ParameterService manages all parameter interactions for notes in the system.
 * It handles parameter value conversion, validation, and provides access to parameter definitions.
 * Each parameter can have both an internal value (used by the audio engine) and a display value
 * (shown in the UI), with automatic conversion between them.
 */
export class ParameterService {
    // Store parameter definitions in a Map for quick lookup
    private definitions: Map<string, ParameterDefinition>;

    constructor() {
        // Initialize parameter definitions map
        this.definitions = new Map(
            PARAMETER_DEFINITIONS.map(def => [def.id, def])
        );
    }

    /**
     * Returns all available parameters as an array.
     * Used by the UI to render parameter controls.
     */
    public getAllParameters(): ParameterDefinition[] {
        return Array.from(this.definitions.values());
    }

    /**
     * Gets both internal and display values for a parameter from a note.
     * Handles special cases for different parameter types (envelope, note properties, etc.)
     * and ensures default values are provided when needed.
     */
    public getValue(note: NoteEvent, parameterId: string): ParameterValue | null {
        const definition = this.definitions.get(parameterId);
        if (!definition) return null;

        let internalValue: number;

        switch (definition.group) {
            case 'envelope':
                // Get envelope parameter value, fallback to default if not set
                internalValue = note.synthesis.envelope[parameterId as keyof typeof note.synthesis.envelope] ??
                    definition.range.defaultValue;
                break;

            case 'note':
                if (parameterId === 'velocity') {
                    // Velocity is stored as 0-127 but used internally as 0-1
                    internalValue = note.velocity / 127;
                } else if (parameterId === 'tuning') {
                    // Tuning is stored directly in cents (-100 to +100)
                    // We no longer divide by 100 since we want to work with the actual cent values
                    internalValue = note.tuning ?? 0;
                    console.log('Getting tuning value:', {
                        raw: note.tuning,
                        internal: internalValue
                    });
                } else {
                    internalValue = definition.range.defaultValue;
                }
                break;

            default:
                internalValue = definition.range.defaultValue;
                break;
        }

        // Calculate display value using the parameter's scale factor
        const displayValue = internalValue * definition.display.scale;

        console.log(`Parameter ${parameterId} values:`, {
            internal: internalValue,
            display: displayValue,
            scale: definition.display.scale
        });

        return {
            internal: internalValue,
            display: displayValue
        };
    }

    /**
     * Converts a display value (from the UI) to an internal value (for the audio engine).
     * Handles special cases for certain parameters that need custom conversion logic.
     */
    public convertToInternal(parameterId: string, displayValue: number): number {
        const definition = this.definitions.get(parameterId);
        if (!definition) return 0;

        let internalValue: number;

        // Direct milliseconds to seconds conversion for ADSR time parameters
        if (['attack', 'decay', 'release'].includes(parameterId)) {
            internalValue = displayValue / 1000;
            // Convert range from ms to seconds for comparison
            const minSeconds = definition.range.min;
            const maxSeconds = definition.range.max;
            return Math.max(minSeconds, Math.min(maxSeconds, internalValue));
        }

        // Special handling for sustain (percentage to ratio)
        if (parameterId === 'sustain') {
            internalValue = displayValue / 100; // Convert percentage to ratio
            return Math.max(definition.range.min, Math.min(definition.range.max, internalValue));
        }

        // Handle other parameters (like tuning)
        internalValue = displayValue / definition.display.scale;
        return Math.max(definition.range.min, Math.min(definition.range.max, internalValue));
    }

    /**
     * Retrieves the definition for a specific parameter.
     * Used when detailed parameter information is needed.
     */
    public getDefinition(parameterId: string): ParameterDefinition | undefined {
        return this.definitions.get(parameterId);
    }

    /**
     * Returns all parameters that belong to a specific group.
     * Useful for showing related parameters together in the UI.
     */
    public getParametersByGroup(group: string): ParameterDefinition[] {
        return Array.from(this.definitions.values())
            .filter(def => def.group === group);
    }
}