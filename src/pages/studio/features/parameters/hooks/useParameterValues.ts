// src/features/parameters/hooks/useParameterValues.ts

import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { selectSelectedNote, selectMultiSelectedNotes } from '../../../../../features/player/store/player';
import { 
    setKeyParameter, 
    selectGlobalWaveform, 
    selectIsIndependentParameterMode,
    selectEditableWaveform,
    setOscillatorParameter
} from '../../../../../features/keyboard/store/slices/keyboard.slice';
import { useParameters } from '../../../../../features/player/hooks/useParameters';
import { parameters } from '../constants/parameters';
import {
    ParameterContext,
    isValidParameterId,
    isEnvelopeParam,
    isNoteProperty,
    isUnisonParam,
    NoteEvent,
    KeyParameterState,
    mapUnisonParamToProperty,
} from '../types/types';

interface SelectedNoteState {
    trackId: string;
    note: NoteEvent;
}

interface ParameterState {
    value: number;
    isMixed: boolean;
}

export const useParameterValues = (activeContext: ParameterContext) => {
    const dispatch = useAppDispatch();
    const selectedKey = useAppSelector(state => state.keyboard.selectedKey);
    const selectedNote = useAppSelector(selectSelectedNote) as SelectedNoteState | null;
    const multiSelectedNotes = useAppSelector(selectMultiSelectedNotes) as SelectedNoteState[];
    const keyParameters = useAppSelector(state => state.keyboard.keyParameters) as Record<number, KeyParameterState>;
    const globalWaveform = useAppSelector(selectGlobalWaveform);
    const isIndependentMode = useAppSelector(selectIsIndependentParameterMode);
    const editableWaveform = useAppSelector(selectEditableWaveform);
    const { handleParameterChange } = useParameters();

    const getNoteParameterValue = useCallback((note: NoteEvent, param: typeof parameters[0]): number | undefined => {
        switch (param.group) {
            case 'filter': {
                const synthesis = note.synthesis;
                return param.id === 'filterCutoff'
                    ? synthesis.effects?.filter?.frequency
                    : synthesis.effects?.filter?.Q;
            }
            case 'envelope': {
                if (isEnvelopeParam(param.id)) {
                    const internalValue = note.synthesis?.envelope?.[param.id];
                    if (internalValue !== undefined) {
                        if (['attack', 'decay', 'release'].includes(param.id)) {
                            return internalValue * 1000;
                        } else if (param.id === 'sustain') {
                            return internalValue * 100;
                        }
                        return internalValue;
                    }
                }
                break;
            }
            case 'unison': {
                if (isUnisonParam(param.id)) {
                    const propName = mapUnisonParamToProperty(param.id);
                    if (propName) {
                        return note.synthesis?.unison?.[propName] ?? 
                            (propName === 'count' ? 1 : 
                             propName === 'detune' ? 10 : 50);
                    }
                }
                break;
            }
            default: {
                if (isNoteProperty(param.id)) {
                    if (param.id === 'velocity') return note.velocity;
                    if (param.id === 'tuning') return note.tuning;
                    return note[param.id];
                }
            }
        }
        return undefined;
    }, []);

    const parameterValues = useMemo(() => {
        if (activeContext === 'note') {
            if (multiSelectedNotes.length > 0) {
                // Handle multiple selected notes
                return parameters.reduce((acc, param) => {
                    const values = multiSelectedNotes.map(noteState =>
                        getNoteParameterValue(noteState.note, param)
                    ).filter((value): value is number => value !== undefined);

                    if (values.length > 0) {
                        const firstValue = values[0];
                        const isMixed = values.some(value => value !== firstValue);
                        acc[param.id] = {
                            value: firstValue,
                            isMixed
                        };
                    } else {
                        acc[param.id] = {
                            value: param.defaultValue,
                            isMixed: false
                        };
                    }

                    // Add waveform if available for each note
                    if (multiSelectedNotes[0]?.note?.synthesis?.waveform) {
                        const waveforms = multiSelectedNotes.map(n => n.note.synthesis?.waveform);
                        const firstWaveform = waveforms[0];
                        const isMixedWaveform = waveforms.some(w => w !== firstWaveform);
                        
                        acc['waveform'] = {
                            value: firstWaveform || 'sine',
                            isMixed: isMixedWaveform
                        };
                    }
                    
                    return acc;
                }, {} as Record<string, ParameterState>);
            } else if (selectedNote) {
                // Handle single selected note
                const values = parameters.reduce((acc, param) => {
                    const value = getNoteParameterValue(selectedNote.note, param) ?? param.defaultValue;
                    acc[param.id] = {
                        value,
                        isMixed: false
                    };
                    return acc;
                }, {} as Record<string, ParameterState>);
                
                // Add waveform if available
                if (selectedNote.note.synthesis?.waveform) {
                    values['waveform'] = {
                        value: selectedNote.note.synthesis.waveform,
                        isMixed: false
                    };
                }
                
                return values;
            }
        } else if (activeContext === 'keyboard' && selectedKey !== null) {
            // Handle keyboard context
            const values = parameters.reduce((values, param) => {
                if (isValidParameterId(param.id)) {
                    // Check if we're in independent mode and have oscillator-specific parameters
                    if (isIndependentMode && 
                        editableWaveform && 
                        keyParameters[selectedKey]?.oscillatorParameters?.[editableWaveform as any] &&
                        (keyParameters[selectedKey].oscillatorParameters![editableWaveform as any] as any)[param.id]) {
                        
                        // Use the oscillator-specific parameter value
                        const paramValue = (keyParameters[selectedKey].oscillatorParameters![editableWaveform as any] as any)[param.id];
                        values[param.id] = {
                            value: paramValue?.value ?? param.defaultValue,
                            isMixed: false
                        };
                    } else {
                        // Use the shared parameter value
                        const paramValue = keyParameters[selectedKey]?.[param.id as keyof KeyParameterState];
                        values[param.id] = {
                            value: paramValue?.value ?? param.defaultValue,
                            isMixed: false
                        };
                    }
                }
                return values;
            }, {} as Record<string, ParameterState>);
            
            // Add waveform for the selected key
            values['waveform'] = {
                value: String(keyParameters[selectedKey]?.waveform || globalWaveform) as any,
                isMixed: false
            };
            
            return values;
        }

        return {};
    }, [
        activeContext, 
        selectedKey, 
        selectedNote, 
        multiSelectedNotes, 
        keyParameters, 
        getNoteParameterValue, 
        globalWaveform,
        isIndependentMode,
        editableWaveform
    ]);

    const handleParameterUpdate = useCallback((parameterId: string, value: number) => {
        if (activeContext === 'keyboard' && selectedKey !== null) {
            if (isValidParameterId(parameterId)) {
                // If we're in independent mode and have an editable waveform, update oscillator-specific parameters
                if (isIndependentMode && editableWaveform) {
                    // Check if this is a unison parameter
                    const isUnisonParameter = ['unisonCount', 'unisonDetune', 'unisonWidth'].includes(parameterId);
                    
                    // Log the parameter change for debugging
                    console.log(`[DEBUG PARAM] Updating ${isIndependentMode ? 'independent' : 'shared'} parameter: ${parameterId} = ${value} for oscillator ${editableWaveform}`);
                    
                    // Use the setOscillatorParameter action to update oscillator-specific parameters
                    dispatch(setOscillatorParameter({
                        keyNumber: selectedKey,
                        waveform: editableWaveform,
                        parameter: parameterId,
                        value
                    }));
                } else {
                    // Standard parameter update (shared parameters)
                    dispatch(setKeyParameter({
                        keyNumber: selectedKey,
                        parameter: parameterId as any,
                        value
                    }));
                }
            }
        } else if (activeContext === 'note') {
            if (multiSelectedNotes.length > 0) {
                // Update all selected notes
                multiSelectedNotes.forEach(noteState => {
                    handleParameterChange(
                        noteState.trackId,
                        noteState.note.id,
                        parameterId,
                        value
                    );
                });
            } else if (selectedNote) {
                // Update single note
                handleParameterChange(
                    selectedNote.trackId,
                    selectedNote.note.id,
                    parameterId,
                    value
                );
            }
        }
    }, [
        dispatch,
        selectedKey,
        selectedNote,
        multiSelectedNotes,
        activeContext,
        handleParameterChange,
        isIndependentMode,
        editableWaveform
    ]);

    return {
        parameterValues,
        handleParameterUpdate
    };
};