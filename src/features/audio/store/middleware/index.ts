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

// Helper to get current parameters for a note
const getNoteParameters = (keyParams: any) => ({
    tuning: keyParams.tuning?.value ?? 0,
    velocity: keyParams.velocity?.value ?? 100,
    envelope: {
        attack: keyParams.attack?.value ?? 0,
        decay: keyParams.decay?.value ?? 200,
        sustain: keyParams.sustain?.value ?? 70,
        release: keyParams.release?.value ?? 150
    },
    filter: {
        cutoff: keyParams.filterCutoff?.value ?? 19000,
        resonance: keyParams.filterResonance?.value ?? 0.707
    }
});

export const audioMiddleware: Middleware<object, RootState> = ({ dispatch, getState }) => next => action => {
    if (!isAudioAction(action)) return next(action);

    const prevState = getState().audio;
    const result = next(action);

    try {
        switch (action.type) {
            case 'keyboard/noteOn': {
                const note = action.payload;
                const mode = getState().keyboard.mode;
                const keyParams = getState().keyboard.keyParameters[note] || {};
                debug.log(`Note on: ${note}, Mode: ${mode}`);

                if (mode === 'drums') {
                    const params = getNoteParameters(keyParams);
                    drumSoundManager.playDrumSound(note, params);
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
                // We don't need to do anything else for drum mode - parameters are stored in state
                // and will be used next time the note is played
                break;
            }

            case 'keyboard/setGlobalWaveform': {
                const waveform = action.payload;
                const isGlobalOscillatorMode = getState().keyboard.isGlobalOscillatorMode;
                debug.log(`Setting global waveform: ${waveform}`);
                
                // Always update the global waveform
                keyboardAudioManager.setGlobalWaveform(waveform);
                
                // In global mode, also update all key-specific waveforms
                if (isGlobalOscillatorMode) {
                    debug.log(`Global oscillator mode active - updating all keys to ${waveform}`);
                    
                    // Update all active keys in the keyboard state
                    const keys = Object.keys(getState().keyboard.keyParameters).map(Number);
                    keys.forEach(keyNumber => {
                        debug.log(`Setting waveform for key ${keyNumber} to ${waveform}`);
                        keyboardAudioManager.setNoteWaveform(keyNumber, waveform);
                        // Also dispatch an action to update the Redux state
                        dispatch({ 
                            type: 'keyboard/setKeyWaveform', 
                            payload: { keyNumber, waveform } 
                        });
                    });
                }
                break;
            }

            case 'keyboard/setKeyWaveform': {
                const { keyNumber, waveform } = action.payload;
                debug.log(`Setting waveform for key ${keyNumber}: ${waveform}`);
                console.log(`[DEBUG MIDDLEWARE] Setting waveform for key ${keyNumber} to ${waveform}`);
                console.log(`[DEBUG MIDDLEWARE] Before: waveform map entry for key ${keyNumber}: ${keyboardAudioManager.getKeyWaveform?.(keyNumber) || 'not available'}`);
                keyboardAudioManager.setNoteWaveform(keyNumber, waveform);
                console.log(`[DEBUG MIDDLEWARE] After: waveform map entry for key ${keyNumber}: ${keyboardAudioManager.getKeyWaveform?.(keyNumber) || 'not available'}`);
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

            case 'keyboard/setBatchParameters': {
                const { notes, parameter, value } = action.payload;
                const mode = getState().keyboard.mode;
                debug.log(`Batch setting parameter ${parameter}=${value} for ${notes.length} notes`);
                
                if (mode !== 'drums') {
                    // Update each note in the audio engine
                    notes.forEach(noteNumber => {
                        keyboardAudioManager.setNoteParameter(noteNumber, parameter, value);
                    });
                }
                
                // Continue to update Redux state
                next(action);
                return;
            }

            case 'keyboard/updateOscillatorBatch': {
                const { notes, oscillatorIndex, changes } = action.payload;
                debug.log(`Batch updating oscillator ${oscillatorIndex} for ${notes.length} notes: ${JSON.stringify(changes)}`);
                
                // Update Redux state first
                next(action);
                
                // Then update each note in the audio engine
                notes.forEach(noteNumber => {
                    // Get the updated oscillators from state
                    const oscillators = getState().keyboard.keyParameters[noteNumber]?.oscillators;
                    
                    if (oscillators && oscillators.length > 0) {
                        // If the note has custom oscillators, update them
                        keyboardAudioManager.setKeyOscillators(noteNumber, oscillators);
                    } else if (changes.waveform && oscillatorIndex === 0) {
                        // For the primary oscillator, fall back to setting the waveform
                        keyboardAudioManager.setNoteWaveform(noteNumber, changes.waveform);
                    }
                });
                
                return;
            }
        }
    } catch (error) {
        debug.error('Error in audio middleware:', error);
    }

    return result;
};

export default audioMiddleware;