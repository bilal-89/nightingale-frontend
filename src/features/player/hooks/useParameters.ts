// src/features/player/hooks/useParameters.ts

import { useCallback } from 'react';
import { useAppDispatch } from './useStore';
import { ParameterService } from '../parameters/parameter.service';
import { updateNoteParameters } from '../state/slices/player.slice';

const parameterService = new ParameterService();

export const useParameters = () => {
    const dispatch = useAppDispatch();

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
                    envelope: {
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
    }, [dispatch]);

    return {
        parameterService,
        handleParameterChange
    };
};