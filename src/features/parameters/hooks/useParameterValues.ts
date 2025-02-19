// useParameterValues.ts

import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectSelectedNote, selectMultiSelectedNotes } from '../../player/store/player';
import { setKeyParameter } from '../../keyboard/store/slices/keyboard.slice';
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
                    return acc;
                }, {} as Record<string, ParameterState>);
            } else if (selectedNote) {
                // Handle single selected note
                return parameters.reduce((acc, param) => {
                    const value = getNoteParameterValue(selectedNote.note, param) ?? param.defaultValue;
                    acc[param.id] = {
                        value,
                        isMixed: false
                    };
                    return acc;
                }, {} as Record<string, ParameterState>);
            }
        } else if (activeContext === 'keyboard' && selectedKey !== null) {
            // Handle keyboard context
            return parameters.reduce((values, param) => {
                if (isValidParameterId(param.id)) {
                    const paramValue = keyParameters[selectedKey]?.[param.id];
                    values[param.id] = {
                        value: paramValue?.value ?? param.defaultValue,
                        isMixed: false
                    };
                }
                return values;
            }, {} as Record<string, ParameterState>);
        }

        return {};
    }, [activeContext, selectedKey, selectedNote, multiSelectedNotes, keyParameters, getNoteParameterValue]);

    const handleParameterUpdate = useCallback((parameterId: string, value: number) => {
        if (activeContext === 'keyboard' && selectedKey !== null) {
            if (isValidParameterId(parameterId)) {
                dispatch(setKeyParameter({
                    keyNumber: selectedKey,
                    parameter: parameterId,
                    value
                }));
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
        handleParameterChange
    ]);

    return {
        parameterValues,
        handleParameterUpdate
    };
};