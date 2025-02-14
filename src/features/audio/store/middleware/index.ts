// src/features/audio/store/middleware/index.ts
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../../../../store';
import { setMode } from '../slice';  // Import from slice instead of actions
import keyboardAudioManager from '../../engine/synthesis/keyboardEngine';
import { drumSoundManager } from '../../engine/synthesis/drumEngine';

// Debug utilities
const debug = {
    log: (...args: any[]) => console.log('[Audio Middleware]', ...args),
    error: (...args: any[]) => console.error('[Audio Middleware]', ...args),
    parameter: (note: number, parameter: string, value: any) => {
        debug.log(`Parameter Change - Note: ${note}, ${parameter}: ${value}`);
    }
};

const isAudioAction = (action: unknown): action is { type: string; payload: any } => {
    return typeof action === 'object' && action !== null && 'type' in action;
};

export const audioMiddleware: Middleware<object, RootState> = ({ dispatch, getState }) => next => action => {
    if (!isAudioAction(action)) return next(action);
    
    const prevState = getState().audio;
    const result = next(action);

    try {
        switch (action.type) {
            case 'keyboard/noteOn': {
                const note = action.payload;
                const mode = getState().keyboard.mode;
                debug.log(`Note on: ${note}, Mode: ${mode}`);

                if (mode === 'drums') {
                    drumSoundManager.playDrumSound(note);
                } else {
                    keyboardAudioManager.playNote(note);
                }
                break;
            }

            case 'keyboard/noteOff': {
                const note = action.payload;
                const mode = getState().keyboard.mode;
                if (mode !== 'drums') {
                    keyboardAudioManager.stopNote(note);
                }
                break;
            }

            case 'keyboard/setKeyParameter': {
                const { keyNumber, parameter, value } = action.payload;
                const mode = getState().keyboard.mode;
                debug.parameter(keyNumber, parameter, value);

                if (mode !== 'drums') {
                    keyboardAudioManager.setNoteParameter(keyNumber, parameter, value);
                }
                break;
            }

            case 'keyboard/setGlobalWaveform': {
                const waveform = action.payload;
                debug.log(`Setting global waveform: ${waveform}`);
                keyboardAudioManager.setGlobalWaveform(waveform);
                break;
            }

            case 'keyboard/setKeyWaveform': {
                const { keyNumber, waveform } = action.payload;
                debug.log(`Setting waveform for key ${keyNumber}: ${waveform}`);
                keyboardAudioManager.setNoteWaveform(keyNumber, waveform);
                break;
            }

            case 'keyboard/setMode': {
                const newMode = action.payload;
                debug.log(`Mode change: ${prevState.mode} -> ${newMode}`);

                // Stop any playing notes
                getState().keyboard.activeNotes.forEach(note => {
                    if (prevState.mode !== 'drums') {
                        keyboardAudioManager.stopNote(note);
                    }
                });

                // Update audio engine mode
                keyboardAudioManager.setMode(newMode);
                // Sync audio state with keyboard state
                dispatch(setMode(newMode));
                break;
            }

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

            case 'keyboard/cleanup': {
                debug.log('Cleaning up audio system');
                try {
                    keyboardAudioManager.cleanup();
                } catch (error) {
                    debug.log('Error during cleanup:', error);
                }
                break;
            }
        }
    } catch (error) {
        debug.error('Error in audio middleware:', error);
    }

    return result;
};

export default audioMiddleware;