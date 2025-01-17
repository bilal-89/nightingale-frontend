import { Middleware, Action, Dispatch, ThunkAction } from '@reduxjs/toolkit';
import KeyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';
import {
    initializeAudio,
    KeyboardState,
} from '../slices/keyboard/keyboard.slice';

interface RootState {
    keyboard: KeyboardState;
}

// Define the type for our keyboard actions
type KeyboardAction = 
  | Action<'keyboard/initializeAudio' | 'keyboard/cleanup'>
  | Action<'keyboard/noteOn' | 'keyboard/noteOff'> & { payload: number }
  | Action<'keyboard/setTuning'> & { payload: { note: number; cents: number } }

// Update the middleware type to explicitly handle KeyboardAction
export const keyboardAudioMiddleware: Middleware<unknown, RootState> = store => next => async (action: unknown) => {
    if (typeof action !== 'object' || !action || !('type' in action)) return next(action);
    const keyboardAction = action as KeyboardAction;
    try {
        switch (keyboardAction.type) {  // No need to cast now since we've typed the action
            case 'keyboard/initializeAudio': {
                await KeyboardAudioManager.initialize();
                break;
            }

            case 'keyboard/noteOn': {
                const state = store.getState();
                const note = keyboardAction.payload as number;
                const tuning = state.keyboard.tunings[note]?.cents || 0;
                console.log(`Playing note ${note} with tuning ${tuning}¢`);
                await KeyboardAudioManager.playNote(note, tuning);
                break;
            }

            case 'keyboard/noteOff': {
                const note = keyboardAction.payload as number;
                console.log(`Stopping note ${note}`);
                KeyboardAudioManager.stopNote(note);
                break;
            }

            case 'keyboard/setTuning': {
                const { note, cents } = keyboardAction.payload as { note: number; cents: number };
                console.log(`Setting tuning for note ${note} to ${cents}¢`);
                KeyboardAudioManager.setNoteTuning(note, cents);
                break;
            }

            case 'keyboard/cleanup': {
                console.log('Cleaning up audio system');
                KeyboardAudioManager.cleanup();
                break;
            }
        }
    } catch (error) {
        console.error('Error in keyboard audio middleware:', error);
    }

    // Always pass the action through
    return next(keyboardAction);
};

// Add AppThunk type
export type AppThunk<ReturnType = void> = ThunkAction<
  Promise<ReturnType>,
  RootState,
  unknown,
  Action<string>
>;

// Update the action creator to return AppThunk
export const initializeAudioContext = (): AppThunk => async (dispatch: Dispatch) => {
    try {
        dispatch(initializeAudio());
    } catch (error) {
        console.error('Failed to initialize audio context:', error);
    }
};