import { Middleware, AnyAction } from '@reduxjs/toolkit';
import keyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';
import { drumSoundManager } from '../../audio/context/drums/drumSoundManager';
import { KeyboardState, KeyboardActionTypes } from '../slices/keyboard/keyboard.slice';

// Enhanced debug utilities to include parameter information
const debug = {
    log: (...args: any[]) => console.log('[Audio Middleware]', ...args),

    state: (label: string, state: Partial<KeyboardState>) => {
        debug.log(`${label}:`, {
            mode: state.mode,
            activeNotes: state.activeNotes?.length,
            parameters: state.keyParameters ? Object.keys(state.keyParameters).length : 0
        });
    },

    // New helper to log parameter changes
    parameter: (note: number, parameter: string, value: number) => {
        debug.log(`Parameter Change - Note: ${note}, ${parameter}: ${value}`);
    }
};

// Action creator for initializing audio context
export const initializeAudioContext = () => ({
    type: 'keyboard/initializeAudio' as const
});

// Type guard for keyboard actions
const isKeyboardAction = (action: unknown): action is AnyAction & { payload?: any } => {
    return typeof action === 'object' && action !== null && 'type' in action;
};

// The main middleware implementation with enhanced parameter handling
export const keyboardAudioMiddleware: Middleware = store => next => action => {
    if (!isKeyboardAction(action)) return next(action);

    const prevState = store.getState().keyboard;
    debug.log('Action received:', action);
    debug.state('Previous state', prevState);

    const result = next(action);

    const currentState = store.getState().keyboard;
    debug.state('Current state', currentState);

    switch (action.type as KeyboardActionTypes) {
        case 'keyboard/initializeAudio':
            debug.log('Initializing audio context');
            try {
                keyboardAudioManager.initialize();
                drumSoundManager.initialize();
                debug.log('Audio context initialized successfully');
            } catch (error) {
                debug.log('Audio context initialization failed:', error);
            }
            break;

        case 'keyboard/noteOn': {
            const note = action.payload;
            const mode = currentState.mode;
            debug.log(`Note on: ${note}, Mode: ${mode}`);

            try {
                if (mode === 'drums') {
                    debug.log('Playing drum sound');
                    drumSoundManager.playDrumSound(note);
                } else {
                    // Get current parameter values for the note
                    const parameters = currentState.keyParameters[note] || {};
                    const velocity = parameters.velocity?.value ?? 100;

                    debug.log('Playing tunable note', { velocity });
                    keyboardAudioManager.playNote(note);
                }
            } catch (error) {
                debug.log('Error playing note:', error);
            }
            break;
        }

        case 'keyboard/noteOff': {
            const note = action.payload;
            const mode = currentState.mode;
            debug.log(`Note off: ${note}, Mode: ${mode}`);

            try {
                if (mode !== 'drums') {
                    keyboardAudioManager.stopNote(note);
                }
            } catch (error) {
                debug.log('Error stopping note:', error);
            }
            break;
        }

        case 'keyboard/setKeyParameter': {
            const { keyNumber, parameter, value } = action.payload;
            const mode = currentState.mode;
            debug.parameter(keyNumber, parameter, value);

            try {
                if (mode !== 'drums') {
                    // Use the unified parameter setting method
                    keyboardAudioManager.setNoteParameter(keyNumber, parameter, value);
                }
            } catch (error) {
                debug.log('Error setting parameter:', error);
            }
            break;
        }

        case 'keyboard/setTuning': {
            // Handle legacy tuning actions for backward compatibility
            const { note: tuningNote, cents } = action.payload;
            const mode = currentState.mode;
            debug.parameter(tuningNote, 'tuning', cents);

            try {
                if (mode !== 'drums') {
                    keyboardAudioManager.setNoteParameter(tuningNote, 'tuning', cents);
                }
            } catch (error) {
                debug.log('Error setting tuning:', error);
            }
            break;
        }

        case 'keyboard/setMode': {
            const newMode = action.payload;
            debug.log(`Setting mode to: ${newMode}`);

            try {
                // Clean up active notes before mode switch
                currentState.activeNotes.forEach(note => {
                    if (prevState.mode !== 'drums') {
                        keyboardAudioManager.stopNote(note);
                    }
                });

                keyboardAudioManager.setMode(newMode);
            } catch (error) {
                debug.log('Error setting mode:', error);
            }
            break;
        }

        case 'keyboard/cleanup':
            debug.log('Cleaning up audio system');
            try {
                keyboardAudioManager.cleanup();
                drumSoundManager.cleanup();
            } catch (error) {
                debug.log('Error during cleanup:', error);
            }
            break;
    }

    return result;
};

export default keyboardAudioMiddleware;