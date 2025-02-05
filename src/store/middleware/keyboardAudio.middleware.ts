// src/store/middleware/keyboard.middleware.ts

import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import keyboardAudioManager from '../../audio/context/keyboard/keyboardAudioManager';
import { drumSoundManager } from '../../audio/context/drums/drumSoundManager';
import { audioServices} from '../../features/audio/services';
import {AUDIO_CONFIG} from '../../features/audio/config';
import {
    KeyboardState,
    selectKeyWaveform,
} from '../slices/keyboard/keyboard.slice.ts';


// At the top of your current keyboard.middleware.ts file, add this export:
export const initializeAudioContext = () => ({
    type: 'keyboard/initializeAudio' as const
});

// Define action types
type KeyboardActionTypes =
    | 'keyboard/initializeAudio'
    | 'keyboard/noteOn'
    | 'keyboard/noteOff'
    | 'keyboard/setKeyParameter'
    | 'keyboard/setGlobalWaveform'
    | 'keyboard/setKeyWaveform'
    | 'keyboard/setTuning'
    | 'keyboard/setMode'
    | 'keyboard/cleanup';

// Define store type
type Store = {
    getState: () => RootState;
    dispatch: (action: AnyAction) => void;
};

const debug = {
    log: (...args: unknown[]) => {
        if (AUDIO_CONFIG.DEBUG) {
            console.log('[Audio Middleware]', ...args);
        }
    },
    state: (label: string, state: Partial<KeyboardState>) => {
        if (AUDIO_CONFIG.DEBUG) {
            debug.log(`${label}:`, {
                mode: state.mode,
                activeNotes: state.activeNotes?.length,
                parameters: state.keyParameters ? Object.keys(state.keyParameters).length : 0
            });
        }
    },
    parameter: (note: number, parameter: string, value: unknown) => {
        if (AUDIO_CONFIG.DEBUG) {
            debug.log(`Parameter Change - Note: ${note}, ${parameter}: ${value}`);
        }
    }
};

const isKeyboardAction = (action: unknown): action is AnyAction & { payload?: unknown } => {
    return typeof action === 'object' && action !== null && 'type' in action;
};

export const keyboardAudioMiddleware: Middleware = store => next => action => {
    if (!isKeyboardAction(action)) return next(action);

    const prevState = store.getState().keyboard;
    debug.log('Action received:', action);
    debug.state('Previous state', prevState);

    const result = next(action);
    const currentState = store.getState().keyboard;
    debug.state('Current state', currentState);
    debug.log('Using', AUDIO_CONFIG.USE_NEW_AUDIO_SYSTEM ? 'new' : 'legacy', 'audio system');

    try {
        if (AUDIO_CONFIG.USE_NEW_AUDIO_SYSTEM) {
            handleNewSystem(action, store as Store, currentState, prevState);
        } else {
            handleLegacySystem(action, store as Store, currentState, prevState);
        }
    } catch (error) {
        debug.log('Error in audio middleware:', error);
    }

    return result;
};

function handleNewSystem(
    action: AnyAction,
    store: Store,
    currentState: KeyboardState,
    prevState: KeyboardState
) {
    switch (action.type as KeyboardActionTypes) {
        case 'keyboard/initializeAudio': {
            debug.log('Initializing new audio system');
            audioServices.initialize().catch(error => {
                debug.log('Error initializing new audio system:', error);
            });
            break;
        }

        case 'keyboard/noteOn': {
            const note = action.payload as number;
            const parameters = currentState.keyParameters[note] || {};
            const velocity = parameters.velocity?.value ?? 100;
            const waveform = selectKeyWaveform(store.getState(), note);
            debug.log(`Note on: ${note}, Mode: ${currentState.mode}, Waveform: ${waveform}`);

            audioServices.voices.handleNoteOn(note, currentState.mode, velocity);
            break;
        }

        case 'keyboard/noteOff': {
            const note = action.payload as number;
            debug.log(`Note off: ${note}, Mode: ${currentState.mode}`);
            audioServices.voices.handleNoteOff(note, currentState.mode);
            break;
        }

        case 'keyboard/setKeyParameter': {
            const { keyNumber, parameter, value } = action.payload as {
                keyNumber: number;
                parameter: string;
                value: number;
            };
            debug.log('setKeyParameter called:', { keyNumber, parameter, value });
            debug.log('Current mode:', currentState.mode);
            debug.log('Current context:', currentState.parameterContext); // Add this

            // Remove this condition to allow parameter updates in any mode
            audioServices.voices.setParameter(keyNumber, parameter, value);
            break;
        }

        case 'keyboard/setGlobalWaveform': {
            const waveform = action.payload;
            debug.log(`Setting global waveform: ${waveform}`);
            audioServices.voices.setGlobalWaveform(waveform); // Add this method to VoiceService
            break;
        }

        case 'keyboard/setKeyWaveform': {
            const { keyNumber, waveform } = action.payload as {
                keyNumber: number;
                waveform: OscillatorType;
            };
            debug.log(`Setting waveform for key ${keyNumber}: ${waveform}`);
            audioServices.voices.setKeyWaveform(keyNumber, waveform); // Add this method to VoiceService
            break;
        }

        case 'keyboard/setTuning': {
            const { note: tuningNote, cents } = action.payload as {
                note: number;
                cents: number;
            };
            debug.parameter(tuningNote, 'tuning', cents);
            if (currentState.mode !== 'drums') {
                audioServices.voices.setParameter(tuningNote, 'tuning', cents);
            }
            break;
        }

        case 'keyboard/setMode': {
            const newMode = action.payload;
            debug.log(`Setting mode to: ${newMode}`);

            // Clean up active notes before mode switch
            currentState.activeNotes.forEach(note => {
                if (prevState.mode !== 'drums') {
                    audioServices.voices.handleNoteOff(note, prevState.mode);
                }
            });
            break;
        }

        case 'keyboard/cleanup': {
            debug.log('Cleaning up new audio system');
            audioServices.cleanup();
            break;
        }
    }
}

function handleLegacySystem(
    action: AnyAction,
    store: Store,
    currentState: KeyboardState,
    prevState: KeyboardState
) {
    switch (action.type as KeyboardActionTypes) {
        case 'keyboard/initializeAudio': {
            debug.log('Initializing legacy audio system');
            Promise.all([
                keyboardAudioManager.initialize(),
                drumSoundManager.initialize()
            ]).then(() => {
                debug.log('Legacy audio system initialized successfully');
            }).catch(error => {
                debug.log('Legacy audio system initialization failed:', error);
            });
            break;
        }

        case 'keyboard/noteOn': {
            const note = action.payload as number;
            const mode = currentState.mode;
            const waveform = selectKeyWaveform(store.getState(), note);
            debug.log(`Note on: ${note}, Mode: ${mode}, Waveform: ${waveform}`);

            if (mode === 'drums') {
                debug.log('Playing drum sound');
                drumSoundManager.playDrumSound(note);
            } else {
                const parameters = currentState.keyParameters[note] || {};
                const velocity = parameters.velocity?.value ?? 100;
                debug.log('Playing tunable note', { velocity, waveform });
                keyboardAudioManager.playNote(note);
            }
            break;
        }

        case 'keyboard/noteOff': {
            const note = action.payload as number;
            const mode = currentState.mode;
            debug.log(`Note off: ${note}, Mode: ${mode}`);

            if (mode !== 'drums') {
                keyboardAudioManager.stopNote(note);
            }
            break;
        }

        case 'keyboard/setKeyParameter': {
            const { keyNumber, parameter, value } = action.payload as {
                keyNumber: number;
                parameter: string;
                value: number;
            };
            const mode = currentState.mode;
            debug.parameter(keyNumber, parameter, value);

            if (mode !== 'drums') {
                keyboardAudioManager.setNoteParameter(keyNumber, parameter, value);
            }
            break;
        }

        case 'keyboard/setGlobalWaveform': {
            const waveform = action.payload as OscillatorType;
            debug.log(`Setting global waveform: ${waveform}`);
            keyboardAudioManager.setGlobalWaveform(waveform);
            break;
        }

        case 'keyboard/setKeyWaveform': {
            const { keyNumber, waveform } = action.payload as {
                keyNumber: number;
                waveform: OscillatorType;
            };
            debug.log(`Setting waveform for key ${keyNumber}: ${waveform}`);
            keyboardAudioManager.setNoteWaveform(keyNumber, waveform);
            break;
        }

        case 'keyboard/setTuning': {
            const { note: tuningNote, cents } = action.payload as {
                note: number;
                cents: number;
            };
            const mode = currentState.mode;
            debug.parameter(tuningNote, 'tuning', cents);

            if (mode !== 'drums') {
                keyboardAudioManager.setNoteParameter(tuningNote, 'tuning', cents);
            }
            break;
        }

        case 'keyboard/setMode': {
            const newMode = action.payload;
            debug.log(`Setting mode to: ${newMode}`);

            // Clean up active notes before mode switch
            currentState.activeNotes.forEach(note => {
                if (prevState.mode !== 'drums') {
                    keyboardAudioManager.stopNote(note);
                }
            });

            keyboardAudioManager.setMode(newMode);
            break;
        }

        case 'keyboard/cleanup': {
            debug.log('Cleaning up legacy audio system');
            keyboardAudioManager.cleanup();
            if ('cleanup' in drumSoundManager) {
                drumSoundManager.cleanup();
            }
            break;
        }
    }
}

export default keyboardAudioMiddleware;