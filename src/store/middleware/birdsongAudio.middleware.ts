import { Middleware } from '@reduxjs/toolkit';
import { birdsongAudioManager } from '../../audio/context/birdsong/birdsongAudioManager';
import { RootState } from '../index';

export const birdsongAudioMiddleware: Middleware<{}, RootState> = store => next => action => {
    const result = next(action);

    switch (action.type) {
        case 'birdsong/initialize':
            birdsongAudioManager.initialize();
            break;

        case 'birdsong/noteOn':
            const state = store.getState();
            if (state.birdsong.isInitialized) {
                birdsongAudioManager.createBirdsongVoice(action.payload, state.birdsong.parameters);
            }
            break;

        case 'birdsong/noteOff':
            birdsongAudioManager.stopNote(action.payload);
            break;

        case 'birdsong/updateParameters':
            const currentState = store.getState();
            currentState.birdsong.activeNotes.forEach(note => {
                birdsongAudioManager.updateParameters(note, action.payload);
            });
            break;
    }

    return result;
};