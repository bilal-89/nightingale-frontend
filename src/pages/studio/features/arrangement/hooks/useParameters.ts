import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks.ts';
import { ParameterService } from '../../parameters/services/parameter.service';
import { updateNoteParameters, selectSelectedNote } from '../../../../../features/player/store/player';
import { NoteEvent } from '../types/noteEvent';
import { isNoteProperty, isEnvelopeParam, isUnisonParam, mapUnisonParamToProperty } from '../utils/parameterUtils';
import { NoteUpdatePayload } from '../types/noteUpdatePayload';
import { SynthesisParameters } from '../types/synthesisParameters';

const parameterService = new ParameterService();

export const useParameters = () => {
    const dispatch = useAppDispatch();
    const selectedNote = useAppSelector(selectSelectedNote);
    const tracks = useAppSelector(state => state.player.tracks);

    const handleParameterChange = useCallback((trackId: string, noteId: string, parameterId: string, value: any) => {
        const trackIndex = tracks.findIndex(t => t.id === trackId);
        const noteIndex = tracks[trackIndex]?.notes.findIndex(n => n.id === noteId);
        
        if (trackIndex === -1 || noteIndex === -1) return;
        
        const noteUpdate: Partial<NoteEvent> = {};
        const synthesisUpdate: Partial<SynthesisParameters> = 
            structuredClone(tracks[trackIndex].notes[noteIndex].synthesis || {});
        
        // Handle waveform updates (specially handled because it's a string not a number)
        if (parameterId === 'waveform') {
            synthesisUpdate.waveform = value;
            noteUpdate.synthesis = synthesisUpdate;
            dispatch(updateNoteParameters({
                trackId,
                noteId,
                updates: noteUpdate
            }));
            return;
        }
        
        // Handle standard number parameters
        if (isNoteProperty(parameterId)) {
            noteUpdate[parameterId as keyof NoteUpdatePayload] = value;
        } else if (isEnvelopeParam(parameterId)) {
            // Convert ms to seconds for time-based parameters
            let convertedValue = value;
            if (['attack', 'decay', 'release'].includes(parameterId)) {
                convertedValue = value / 1000; // ms to seconds
            } else if (parameterId === 'sustain') {
                convertedValue = value / 100; // percentage to [0-1]
            }
            
            if (!synthesisUpdate.envelope) {
                synthesisUpdate.envelope = {};
            }
            synthesisUpdate.envelope[parameterId] = convertedValue;
        } else if (isUnisonParam(parameterId)) {
            // Handle unison parameters
            const propName = mapUnisonParamToProperty(parameterId);
            if (propName) {
                if (!synthesisUpdate.unison) {
                    synthesisUpdate.unison = {};
                }
                synthesisUpdate.unison[propName] = value;
            }
        } else if (parameterId === 'filterCutoff' || parameterId === 'filterResonance') {
            // Handle filter parameters
            if (!synthesisUpdate.effects) {
                synthesisUpdate.effects = {};
            }
            if (!synthesisUpdate.effects.filter) {
                synthesisUpdate.effects.filter = {};
            }
            
            if (parameterId === 'filterCutoff') {
                synthesisUpdate.effects.filter.frequency = value;
            } else {
                synthesisUpdate.effects.filter.Q = value;
            }
        }
        
        if (Object.keys(synthesisUpdate).length > 0) {
            noteUpdate.synthesis = synthesisUpdate;
        }
        
        if (Object.keys(noteUpdate).length > 0) {
            dispatch(updateNoteParameters({
                trackId,
                noteId,
                updates: noteUpdate
            }));
        }
    }, [dispatch, tracks]);

    return {
        parameterService,
        handleParameterChange
    };
};