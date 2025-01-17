import { Middleware } from '@reduxjs/toolkit';
import { drumSoundManager } from '../../audio/context/drums/drumSoundManager';
import { RootState } from '../index';

export const drumAudioMiddleware: Middleware<{}, RootState> = store => next => action => {
    const result = next(action);

    if (action.type === 'keyboard/noteOn' && store.getState().keyboard.mode === 'drums') {
        drumSoundManager.playDrumSound(action.payload);
    }

    return result;
};