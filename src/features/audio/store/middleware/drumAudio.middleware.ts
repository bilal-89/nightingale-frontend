// src/features/audio/store/middleware/drumAudio.middleware.ts
import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { drumSoundManager } from '../../engine/synthesis/drumEngine';
import { RootState } from '../../../../store';

const isKeyboardAction = (action: unknown): action is AnyAction & { payload: number } => {
    return typeof action === 'object' && action !== null && 'type' in action && 'payload' in action;
};

export const drumAudioMiddleware: Middleware<{}, RootState> = store => next => action => {
    const result = next(action);

    if (isKeyboardAction(action) && action.type === 'keyboard/noteOn' && store.getState().keyboard.mode === 'drums') {
        drumSoundManager.playDrumSound(action.payload);
    }

    return result;
};