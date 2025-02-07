import { Middleware, AnyAction } from '@reduxjs/toolkit';
import keyboardAudioManager from '../../features/audio/engine/synthesis/keyboardEngine';
import { drumSoundManager } from '../../features/audio/engine/synthesis/drumEngine';
import {
    KeyboardState,
    KeyboardActionTypes,
    selectKeyWaveform,
    selectGlobalWaveform
} from '../slices/keyboard/keyboard.slice';

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
    parameter: (note: number, parameter: string, value: any) => {
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

export const keyboardAudioMiddleware: Middleware = store => next => action => {
    if (!isKeyboardAction(action)) return next(action);

    const prevState = store.getState().keyboard;
    debug.log('Action received:', action);
    debug.state('Previous state', prevState);

    // Process the action first to ensure state updates
    const result = next(action);

    // Get updated state after action
    const currentState = store.getState().keyboard;
    debug.state('Current state', currentState);

    try {
        switch (action.type as KeyboardActionTypes) {
            case 'keyboard/initializeAudio': {
                debug.log('Initializing audio context');
                try {
                    Promise.all([
                        keyboardAudioManager.initialize(),
                        drumSoundManager.initialize()
                    ]).then(() => {
                        debug.log('Audio context initialized successfully');
                    });
                } catch (error) {
                    debug.log('Audio context initialization failed:', error);
                }
                break;
            }

            case 'keyboard/noteOn': {
                const note = action.payload;
                const mode = currentState.mode;
                const waveform = selectKeyWaveform(store.getState(), note);
                debug.log(`Note on: ${note}, Mode: ${mode}, Waveform: ${waveform}`);

                try {
                    if (mode === 'drums') {
                        debug.log('Playing drum sound');
                        drumSoundManager.playDrumSound(note);
                    } else {
                        const parameters = currentState.keyParameters[note] || {};
                        const velocity = parameters.velocity?.value ?? 100;
                        debug.log('Playing tunable note', { velocity, waveform });
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
                        keyboardAudioManager.setNoteParameter(keyNumber, parameter, value);
                    }
                } catch (error) {
                    debug.log('Error setting parameter:', error);
                }
                break;
            }

            case 'keyboard/setGlobalWaveform': {
                const waveform = action.payload;
                debug.log(`Setting global waveform: ${waveform}`);

                try {
                    keyboardAudioManager.setGlobalWaveform(waveform);
                } catch (error) {
                    debug.log('Error setting global waveform:', error);
                }
                break;
            }

            case 'keyboard/setKeyWaveform': {
                const { keyNumber, waveform } = action.payload;
                debug.log(`Setting waveform for key ${keyNumber}: ${waveform}`);

                try {
                    keyboardAudioManager.setNoteWaveform(keyNumber, waveform);
                } catch (error) {
                    debug.log('Error setting key waveform:', error);
                }
                break;
            }

            case 'keyboard/setTuning': {
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

            case 'keyboard/cleanup': {
                debug.log('Cleaning up audio system');
                try {
                    keyboardAudioManager.cleanup();
                    drumSoundManager.cleanup();
                } catch (error) {
                    debug.log('Error during cleanup:', error);
                }
                break;
            }
        }
    } catch (error) {
        debug.log('Unhandled error in audio middleware:', error);
    }

    return result;
};

export default keyboardAudioMiddleware;