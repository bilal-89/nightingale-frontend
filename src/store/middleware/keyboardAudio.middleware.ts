import { Middleware, Action, Dispatch, ThunkAction } from '@reduxjs/toolkit';
import KeyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';
import { drumSoundManager } from '../../audio/context/drums/drumSoundManager';
import {
    initializeAudio,
    KeyboardState,
    SynthMode
} from '../slices/keyboard/keyboard.slice';

interface RootState {
    keyboard: KeyboardState;
}

type KeyboardAction =
    | Action<'keyboard/initializeAudio' | 'keyboard/cleanup'>
    | Action<'keyboard/noteOn' | 'keyboard/noteOff'> & { payload: number }
    | Action<'keyboard/setTuning'> & { payload: { note: number; cents: number } }
    | Action<'keyboard/setMode'> & { payload: SynthMode }

const debugLog = (message: string, data?: any) => {
    console.log(`[Audio Debug] ${message}`, data || '');
};

// Track active notes to ensure cleanup
const activeNotes = new Set<number>();

export const keyboardAudioMiddleware: Middleware<unknown, RootState> = store => next => async (action: unknown) => {
    if (typeof action !== 'object' || !action || !('type' in action)) return next(action);
    const keyboardAction = action as KeyboardAction;

    debugLog('Received action:', keyboardAction);

    const previousState = store.getState();
    const result = next(keyboardAction);
    const currentState = store.getState();

    try {
        switch (keyboardAction.type) {
            case 'keyboard/initializeAudio': {
                debugLog('Initializing audio systems');
                await KeyboardAudioManager.initialize();
                await drumSoundManager.initialize();
                debugLog('Audio systems initialized');
                break;
            }

            case 'keyboard/noteOn': {
                const state = store.getState();
                const note = keyboardAction.payload as number;
                const mode = state.keyboard.mode;
                const tuning = state.keyboard.tunings[note]?.cents || 0;

                debugLog('Playing note', {
                    note,
                    mode,
                    tuning,
                    keyboardManagerMode: KeyboardAudioManager.getCurrentMode()
                });

                // Track the active note
                activeNotes.add(note);

                switch (mode) {
                    case 'drums': {
                        debugLog('Attempting to play drum sound');
                        drumSoundManager.playDrumSound(note, tuning);
                        debugLog('Drum sound played');
                        break;
                    }
                    case 'birdsong':
                    case 'tunable': {
                        debugLog(`Attempting to play ${mode} note`);
                        await KeyboardAudioManager.playNote(note, tuning);
                        debugLog(`${mode} note played`);
                        break;
                    }
                }
                break;
            }

            case 'keyboard/noteOff': {
                const state = store.getState();
                const note = keyboardAction.payload as number;

                debugLog('Note off received', {
                    note,
                    mode: state.keyboard.mode
                });

                // Always try to stop the note in both managers
                if (state.keyboard.mode !== 'drums') {
                    KeyboardAudioManager.stopNote(note);
                    debugLog('Note stopped in KeyboardAudioManager');
                }

                // Remove from active notes tracking
                activeNotes.delete(note);
                debugLog('Note removed from tracking');
                break;
            }

            case 'keyboard/setMode': {
                const newMode = keyboardAction.payload as SynthMode;
                debugLog('Setting new mode', {
                    from: previousState.keyboard.mode,
                    to: newMode
                });

                // Clean up all active notes when changing modes
                activeNotes.forEach(note => {
                    KeyboardAudioManager.stopNote(note);
                    debugLog(`Cleaning up note ${note}`);
                });
                activeNotes.clear();

                KeyboardAudioManager.setMode(newMode);
                debugLog('Mode change complete');
                break;
            }

            case 'keyboard/cleanup': {
                // Clean up all active notes
                activeNotes.forEach(note => {
                    KeyboardAudioManager.stopNote(note);
                    debugLog(`Cleaning up note ${note}`);
                });
                activeNotes.clear();

                debugLog('Cleaning up audio system');
                KeyboardAudioManager.cleanup();
                break;
            }

            case 'keyboard/setTuning': {
                const { note, cents } = keyboardAction.payload as { note: number; cents: number };
                debugLog('Setting tuning', { note, cents });

                // Only update tuning if the note is currently active
                if (activeNotes.has(note)) {
                    KeyboardAudioManager.setNoteTuning(note, cents);
                }
                break;
            }
        }
    } catch (error) {
        debugLog('Error in audio middleware', error);
        console.error('Error in keyboard audio middleware:', error);

        // If an error occurs, try to clean up all notes
        activeNotes.forEach(note => {
            try {
                KeyboardAudioManager.stopNote(note);
            } catch (e) {
                console.error('Error during cleanup:', e);
            }
        });
        activeNotes.clear();
    }

    return result;
};

// Clean up function for component unmounting or page changes
export const cleanupAudio = () => {
    activeNotes.forEach(note => {
        KeyboardAudioManager.stopNote(note);
    });
    activeNotes.clear();
    KeyboardAudioManager.cleanup();
};

export type AppThunk<ReturnType = void> = ThunkAction<
    Promise<ReturnType>,
    RootState,
    unknown,
    Action<string>
>;

export const initializeAudioContext = (): AppThunk => async (dispatch: Dispatch) => {
    try {
        debugLog('Initializing audio context');
        dispatch(initializeAudio());
        debugLog('Audio context initialized');
    } catch (error) {
        debugLog('Failed to initialize audio context', error);
        console.error('Failed to initialize audio context:', error);
    }
};