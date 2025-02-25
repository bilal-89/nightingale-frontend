import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { ParameterService } from '../parameters/parameter.service';
import { updateNoteParameters, selectSelectedNote } from '../store/player';


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

        const internalValue = parameterService.convertToInternal(parameterId, displayValue);

        console.log('Converted to internal:', {
            displayValue,
            internalValue
        });

        const updates: any = {};

        // Handle different parameter types
        switch (parameterService.getDefinition(parameterId)?.group) {
            case 'envelope':
                updates.synthesis = {
                    ...selectedNote?.note.synthesis,  // Preserve existing synthesis state
                    envelope: {
                        ...selectedNote?.note.synthesis?.envelope,  // Preserve existing envelope state
                        [parameterId]: internalValue
                    }
                };
                break;

            case 'note':
                if (parameterId === 'velocity') {
                    updates.velocity = Math.round(internalValue * 127);
                } else if (parameterId === 'tuning') {
                    updates.tuning = internalValue;
                }
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