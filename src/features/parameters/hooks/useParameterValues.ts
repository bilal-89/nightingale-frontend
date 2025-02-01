import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectSelectedNote } from '../../player/state/slices/player.slice';
import { setKeyParameter } from '../../../store/slices/keyboard/keyboard.slice';
import { useParameters } from '../../player/hooks/useParameters';
import { parameters } from '../constants/parameters';
import {
    ParameterContext,
    isValidParameterId,
    isEnvelopeParam,
    isNoteProperty,
    NoteEvent,
    KeyParameterState,
} from '../types/types';

// Define the shape of a selected note in our application state
interface SelectedNoteState {
    trackId: string;
    note: NoteEvent;
}

/**
 * Hook for managing parameter values and updates across keyboard and note contexts.
 * Handles the complexity of accessing and updating parameters in different contexts
 * while maintaining type safety.
 */
export const useParameterValues = (activeContext: ParameterContext) => {
    // Set up our Redux hooks
    const dispatch = useAppDispatch();

    // Get necessary state from Redux store
    const selectedKey = useAppSelector(state => state.keyboard.selectedKey);
    const selectedNote = useAppSelector(selectSelectedNote) as SelectedNoteState | null;
    const keyParameters = useAppSelector(state => state.keyboard.keyParameters) as Record<number, KeyParameterState>;

    // Get parameter change handler from useParameters hook
    const { handleParameterChange } = useParameters();


    /**
     * Calculate current parameter values based on context and selection state.
     * This handles both keyboard and note contexts, providing appropriate values
     * for all parameters based on the current state.
     */
    const parameterValues = useMemo(() => {
        // Handle note context when a note is selected
        if (activeContext === 'note' && selectedNote) {
            return parameters.reduce((acc, param) => {
                let rawValue: number | undefined;

                // Determine the value based on parameter group
                switch (param.group) {
                    case 'filter': {
                        // Handle filter parameters (cutoff and resonance)
                        const synthesis = selectedNote.note.synthesis;
                        rawValue = param.id === 'filterCutoff'
                            ? synthesis.effects?.filter?.frequency
                            : synthesis.effects?.filter?.Q;
                        break;
                    }
                    case 'envelope': {
                        // Handle envelope parameters (ADSR)
                        if (isEnvelopeParam(param.id)) {
                            // Convert from internal (seconds) to display (ms)
                            const internalValue = selectedNote.note.synthesis?.envelope?.[param.id];
                            if (internalValue !== undefined) {
                                // Time parameters need to be converted from seconds to ms
                                if (['attack', 'decay', 'release'].includes(param.id)) {
                                    rawValue = internalValue * 1000;
                                } else if (param.id === 'sustain') {
                                    // Sustain needs to be converted from ratio to percentage
                                    rawValue = internalValue * 100;
                                } else {
                                    rawValue = internalValue;
                                }
                            }
                        }
                        break;
                    }
                    default: {
                        // Handle basic note properties (tuning, velocity, etc.)
                        if (isNoteProperty(param.id)) {
                            if (param.id === 'velocity') {
                                rawValue = selectedNote.note.velocity;
                            } else if (param.id === 'tuning') {
                                rawValue = selectedNote.note.tuning;
                            } else {
                                rawValue = selectedNote.note[param.id];
                            }
                        }
                        break;
                    }
                }

                console.log(`Parameter ${param.id} value:`, {
                    raw: rawValue,
                    default: param.defaultValue,
                    final: rawValue ?? param.defaultValue
                });

                // Use default value if no value is found
                acc[param.id] = rawValue ?? param.defaultValue;
                return acc;
            }, {} as Record<string, number>);
        }

        // Handle keyboard context when a key is selected
        if (activeContext === 'keyboard' && selectedKey !== null) {
            return parameters.reduce((values, param) => {
                if (isValidParameterId(param.id)) {
                    // Get the parameter value for the selected key
                    const paramValue = keyParameters[selectedKey]?.[param.id];
                    values[param.id] = paramValue?.value ?? param.defaultValue;
                }
                return values;
            }, {} as Record<string, number>);
        }

        // Return empty object if no context or selection
        return {};
    }, [activeContext, selectedKey, selectedNote, keyParameters]);

    /**
     * Handle parameter value updates for both keyboard and note contexts.
     * This ensures type safety when updating parameters and handles the different
     * update paths for each context.
     */
    const handleParameterUpdate = useCallback((parameterId: string, value: number) => {
        // Log parameter updates for debugging
        console.log('Parameter update:', { parameterId, value, activeContext });

        // Handle keyboard context updates
        if (activeContext === 'keyboard' && selectedKey !== null) {
            // Verify parameter ID is valid for keyboard context
            if (isValidParameterId(parameterId)) {
                dispatch(setKeyParameter({
                    keyNumber: selectedKey,
                    parameter: parameterId,
                    value
                }));
            } else {
                console.warn(`Invalid parameter ID for keyboard context: ${parameterId}`);
            }
        }
        // Handle note context updates
        else if (activeContext === 'note' && selectedNote) {
            handleParameterChange(
                selectedNote.trackId,
                selectedNote.note.id,
                parameterId,
                value
            );
        }
    }, [dispatch, selectedKey, selectedNote, activeContext, handleParameterChange]);

    // Return both the current values and the update handler
    return {
        parameterValues,
        handleParameterUpdate
    };
};