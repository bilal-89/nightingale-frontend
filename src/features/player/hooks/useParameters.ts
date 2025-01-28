// src/features/player/hooks/useParameters.ts

import { useCallback } from 'react';
import { useAppDispatch } from './useStore';
import { updateNoteParameters } from '../state/slices/player.slice';
import { ParameterService } from '../parameters/parameter.service';

const parameterService = new ParameterService();

export const useParameters = () => {
    const dispatch = useAppDispatch();

    const handleParameterChange = useCallback((
        clipId: string,
        noteIndex: number,
        parameterId: string,
        displayValue: number
    ) => {
        const definition = parameterService.getDefinition(parameterId);
        if (!definition) return;

        const internalValue = parameterService.convertToInternal(parameterId, displayValue);

        switch (definition.group) {
            case 'envelope':
                dispatch(updateNoteParameters({
                    clipId,
                    noteIndex,
                    parameters: {
                        synthesis: {
                            envelope: {
                                [parameterId]: internalValue
                            }
                        }
                    }
                }));
                break;
            case 'note':
                dispatch(updateNoteParameters({
                    clipId,
                    noteIndex,
                    parameters: {
                        [parameterId]: internalValue
                    }
                }));
                break;
        }
    }, [dispatch]);

    return {
        parameterService,
        handleParameterChange
    };
};