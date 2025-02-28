import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { ParameterService } from '../../parameters/services/parameter.service';
import { updateNoteParameters, selectSelectedNote } from '../store/player';
import { NoteEvent } from '../types/noteEvent';

const parameterService = new ParameterService();

export const useParameters = () => {
    const dispatch = useAppDispatch();
    const selectedNote = useAppSelector(selectSelectedNote);

    const handleParameterChange = useCallback((
        trackId: string,
        noteId: string,
        parameterId: string,
        displayValue: number
    ) => {
        console.log('Parameter change:', {
            trackId,
            noteId,
            parameterId,
            displayValue
        });

        console.log('Selected note:', selectedNote);

        const internalValue = parameterService.convertToInternal(parameterId, displayValue);
        console.log('Converted to internal:', {
            displayValue,
            internalValue
        });

        let updates: Partial<NoteEvent> = {};

        const paramDef = parameterService.getDefinition(parameterId);
        const group = paramDef?.group;

        switch (group) {
            case 'note':
                if (parameterId === 'velocity') {
                    updates.velocity = Math.round(internalValue * 127);
                } else if (parameterId === 'tuning') {
                    updates.tuning = internalValue;
                }
                break;

            case 'envelope':
                updates.synthesis = {
                    envelope: {
                        [parameterId]: internalValue
                    }
                };
                break;

            case 'unison':
                const unisonParamName = parameterId.replace('unison', '').toLowerCase();
                updates.synthesis = {
                    unison: {
                        [unisonParamName]: internalValue || displayValue
                    }
                };
                break;
        }

        console.log('Dispatching update:', {
            trackId,
            noteId,
            updates
        });

        dispatch(updateNoteParameters({
            trackId,
            noteId,
            updates
        }));
    }, [dispatch, selectedNote]);

    return {
        parameterService,
        handleParameterChange
    };
};