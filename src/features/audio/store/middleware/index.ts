// src/features/audio/store/middleware/index.ts
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../../../../store';
import { setMode as setAudioMode } from '../slice';
import keyboardAudioManager, { AdditiveOscillator } from '../../../../pages/studio/features/oscillators/engine/synthesis/keyboardEngine.ts';
import { drumSoundManager } from '../../../../pages/studio/features/oscillators/engine/synthesis/drumEngine.ts';
import {
    Waveform,
    noteOn,
    noteOff,
    initializeAudio,
    setKeyParameter,
    setGlobalWaveform,
    setKeyWaveform,
    setMode as setKeyboardMode,
    cleanup,
    toggleWaveform,
    setEditableWaveform,
    selectActiveWaveforms,
    selectEditableWaveform,
    setHarmonics,
    setHarmonicAmplitude
} from '../../../keyboard/store/slices/keyboard.slice';

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

                // Debug waveform settings before playing
                const noteWaveform = getState().keyboard.keyParameters[note]?.waveform;
                const globalWaveform = getState().keyboard.globalWaveform;
                const isGlobalMode = getState().keyboard.isGlobalOscillatorMode;
                debug.log(`Playing note ${note} with waveform settings:
                    - Note-specific waveform: ${noteWaveform || 'none'}
                    - Global waveform: ${globalWaveform}
                    - Using global mode: ${isGlobalMode}
                    - Will use: ${noteWaveform || globalWaveform}`);

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

            case 'keyboard/setOscillatorParameter': {
                const { keyNumber, waveform, parameter, value } = action.payload;
                const mode = getState().keyboard.mode;
                debug.log(`Setting oscillator parameter: ${parameter} = ${value} for note ${keyNumber}, waveform ${waveform}`);

                if (mode !== 'drums') {
                    // Call the oscillator-specific parameter setter in the keyboard engine
                    keyboardAudioManager.setOscillatorParameter(keyNumber, waveform, parameter, value);
                }
                break;
            }

            case 'keyboard/setGlobalWaveform': {
                const waveform = action.payload;
                const isGlobalOscillatorMode = getState().keyboard.isGlobalOscillatorMode;
                debug.log(`Setting global waveform: ${waveform}, isGlobalMode: ${isGlobalOscillatorMode}`);
                
                // Always update the global waveform since that's what this action is for
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
                } else {
                    // In local mode, we don't update key-specific waveforms when global waveform changes
                    debug.log(`Local oscillator mode active - NOT updating individual keys`);
                }
                break;
            }

            case 'keyboard/setKeyWaveform': {
                const { keyNumber, waveform } = action.payload;
                debug.log(`Setting waveform for key ${keyNumber}: ${waveform}`);
                console.log(`[DEBUG MIDDLEWARE] Setting waveform for key ${keyNumber} to ${waveform}`);
                
                // Make sure this updates only this specific key without affecting the global waveform
                keyboardAudioManager.setNoteWaveform(keyNumber, waveform);
                console.log(`[DEBUG MIDDLEWARE] Updated waveform map entry for key ${keyNumber}: ${keyboardAudioManager.getKeyWaveform?.(keyNumber) || 'not available'}`);
                
                // In local mode, we should NOT update the global waveform
                // This is important to ensure local mode changes stay local
                const isGlobalMode = getState().keyboard.isGlobalOscillatorMode;
                if (!isGlobalMode) {
                    console.log(`[DEBUG MIDDLEWARE] In local mode - NOT updating global waveform`);
                }
                
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
                dispatch(setAudioMode(newMode));
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

            case 'keyboard/toggleOscillatorMode': {
                const isGlobalMode = getState().keyboard.isGlobalOscillatorMode;
                debug.log(`Oscillator mode toggled to ${isGlobalMode ? 'global' : 'local'}`);
                
                // Update the audio engine
                keyboardAudioManager.setOscillatorMode(isGlobalMode);
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
                    notes.forEach((noteNumber: number) => {
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
                notes.forEach((noteNumber: number) => {
                    // Get the updated oscillators from state
                    // @ts-ignore - oscillators might not exist on keyParameters
                    const oscillators = getState().keyboard.keyParameters[noteNumber]?.oscillators;
                    
                    if (oscillators && oscillators.length > 0) {
                        // If the note has custom oscillators, update them
                        // @ts-ignore - setKeyOscillators might not exist on keyboardAudioManager
                        keyboardAudioManager.setKeyOscillators?.(noteNumber, oscillators);
                    } else if (changes.waveform && oscillatorIndex === 0) {
                        // For the primary oscillator, fall back to setting the waveform
                        keyboardAudioManager.setNoteWaveform(noteNumber, changes.waveform);
                    }
                });
                
                return;
            }

            case 'keyboard/setHarmonics': {
                const { waveform, harmonics, keyNumber } = action.payload;
                const mode = getState().keyboard.mode;
                debug.log(`Setting harmonics for ${keyNumber ? `note ${keyNumber}` : 'global'}, waveform ${waveform}: ${harmonics.join(', ')}`);

                if (mode !== 'drums') {
                    if (keyNumber !== undefined) {
                        // Update note-specific harmonics
                        keyboardAudioManager.setNoteHarmonics(keyNumber, waveform, harmonics);
                    } else {
                        // Update global harmonics
                        keyboardAudioManager.setGlobalHarmonics(waveform, harmonics);
                    }
                }
                break;
            }
            
            case 'keyboard/setHarmonicAmplitude': {
                const { waveform, harmonicIndex, value, keyNumber } = action.payload;
                const mode = getState().keyboard.mode;
                debug.log(`Setting harmonic ${harmonicIndex} amplitude to ${value} for ${keyNumber ? `note ${keyNumber}` : 'global'}, waveform ${waveform}`);

                if (mode !== 'drums') {
                    // Get current harmonics for the specified context
                    let currentHarmonics: number[] = [100, 0, 0, 0, 0, 0, 0, 0]; // Default sine wave
                    
                    // Try to get existing harmonics from state
                    if (keyNumber !== undefined) {
                        const keyParams = getState().keyboard.keyParameters[keyNumber];
                        const isIndependentMode = getState().keyboard.isIndependentParameterMode;
                        
                        if (isIndependentMode && keyParams?.oscillatorHarmonics?.[waveform]) {
                            currentHarmonics = [...keyParams.oscillatorHarmonics[waveform].amplitudes];
                        } else if (keyParams?.harmonics) {
                            currentHarmonics = [...keyParams.harmonics.amplitudes];
                        } else {
                            // Fall back to global harmonics
                            const globalHarmonics = getState().keyboard.globalHarmonics[waveform];
                            if (globalHarmonics) {
                                currentHarmonics = [...globalHarmonics.amplitudes];
                            }
                        }
                    } else {
                        // Global harmonics
                        const globalHarmonics = getState().keyboard.globalHarmonics[waveform];
                        if (globalHarmonics) {
                            currentHarmonics = [...globalHarmonics.amplitudes];
                        }
                    }
                    
                    // Update the specific harmonic amplitude
                    currentHarmonics[harmonicIndex] = value;
                    
                    // Apply the updated harmonics immediately to the audio engine
                    if (keyNumber !== undefined) {
                        // Update for specific note
                        keyboardAudioManager.setNoteHarmonics(keyNumber, waveform, currentHarmonics);
                    } else {
                        // Update globally
                        keyboardAudioManager.setGlobalHarmonics(waveform, currentHarmonics);
                    }
                }
                break;
            }
        }
    } catch (error) {
        debug.error('Error in audio middleware:', error);
    }

    return result;
};

// Separate middleware to handle waveform toggling and editing
const waveformMiddleware: Middleware<object, RootState> = ({ dispatch, getState }) => next => action => {
    // Don't call next(action) here again, as it's already been handled by audioMiddleware
    // Just process the action for waveform-related side effects
    const result = action; // Just use the action directly, don't call next
    
    // Handle waveform-related actions
    if (action && typeof action === 'object' && 'type' in action) {
        if (action.type === toggleWaveform.type || action.type === setEditableWaveform.type) {
            const state = getState();
            const activeWaveforms = selectActiveWaveforms(state);
            const editableWaveform = selectEditableWaveform(state);
            const isGlobalMode = state.keyboard.isGlobalOscillatorMode;
            const selectedKey = state.keyboard.selectedKey;
            const activeNotes = state.keyboard.activeNotes;
            const oscillatorMode = state.keyboard.oscillatorMode;
            
            if (oscillatorMode === 'single') {
                // For single oscillator mode, the primary concern is ensuring we respect local vs global mode
                
                // Get the effective key to modify (selected key or the last active note)
                const effectiveKey = selectedKey !== null 
                    ? selectedKey 
                    : activeNotes.length > 0 
                        ? activeNotes[activeNotes.length - 1] 
                        : null;
                
                // If we have an editable waveform, use that, otherwise use the first active or default to sine
                const waveform = editableWaveform || (activeWaveforms.length > 0 ? activeWaveforms[0] : 'sine');
                
                console.log(`[WAVEFORM DEBUG] Single mode, isGlobalMode: ${isGlobalMode}, selectedKey: ${selectedKey}, effectiveKey: ${effectiveKey}, waveform: ${waveform}`);
                
                if (isGlobalMode) {
                    // GLOBAL MODE: update all keys
                    keyboardAudioManager.setGlobalWaveform(waveform);
                    console.log(`[WAVEFORM SYNC] Single mode (global): Set waveform to ${waveform}`);
                    
                    // Also update any existing keys
                    const allKeys = Object.keys(state.keyboard.keyParameters).map(Number);
                    allKeys.forEach(keyNumber => {
                        keyboardAudioManager.setNoteWaveform(keyNumber, waveform);
                    });
                } else {
                    // LOCAL MODE: only update specific keys, NEVER update global
                    
                    // Primary approach: update the selected key if available
                    if (effectiveKey !== null) {
                        keyboardAudioManager.setNoteWaveform(effectiveKey, waveform);
                        console.log(`[WAVEFORM SYNC] Single mode (local): Set waveform for key ${effectiveKey} to ${waveform}`);
                    } 
                    // Fallback: do nothing in local mode if no key is selected or active
                    else {
                        console.warn(`[WAVEFORM SYNC] Single mode (local): No key to update, skipping waveform change`);
                    }
                    
                    // IMPORTANT: Never update global waveform in local mode
                }
            } 
            // In multi oscillator mode, handle multiple waveforms
            else if (oscillatorMode === 'multi') {
                // In global mode, update all keys with active waveforms
                if (isGlobalMode) {
                    // Log detailed information about the state
                    console.log(`[WAVEFORM SYNC] Multi mode (global): State before update:
                    - Active waveforms: ${activeWaveforms.join(', ')}
                    - Editable waveform: ${editableWaveform || 'none'}
                    - Active notes: ${activeNotes.join(', ')}
                    - Selected key: ${selectedKey}`);
                    
                    // Pass all active waveforms to the audio engine
                    // This is critical for making multiple oscillators work in global mode
                    keyboardAudioManager.setGlobalActiveWaveforms(activeWaveforms);
                    
                    console.log(`[WAVEFORM SYNC] Multi mode (global): Updated all keys with waveforms: ${activeWaveforms.join(', ')}, editable: ${editableWaveform}`);
                } 
                // In local mode, handle selected key and active notes
                else {
                    // Get the effective key to modify (selected key or the last active note)
                    const effectiveKey = selectedKey !== null 
                        ? selectedKey 
                        : activeNotes.length > 0 
                            ? activeNotes[activeNotes.length - 1] 
                            : null;
                            
                    if (effectiveKey !== null) {
                        // Get the key-specific active waveforms
                        const keyParams = state.keyboard.keyParameters[effectiveKey];
                        const keyActiveWaveforms = keyParams?.activeWaveforms ?? [];
                        
                        // If the key has its own active waveforms, use those
                        if (keyParams?.activeWaveforms) {
                            console.log(`[WAVEFORM SYNC] Multi mode (local): Found key-specific waveforms for key ${effectiveKey}: ${keyActiveWaveforms.join(', ')}`);
                            keyboardAudioManager.setActiveWaveforms(effectiveKey, keyActiveWaveforms);
                        } else {
                            // Otherwise, use the global active waveforms for this key
                            console.log(`[WAVEFORM SYNC] Multi mode (local): No key-specific waveforms for key ${effectiveKey}, using global: ${activeWaveforms.join(', ')}`);
                            keyboardAudioManager.setActiveWaveforms(effectiveKey, activeWaveforms);
                            
                            // And store them in the key's parameters
                            if (!state.keyboard.keyParameters[effectiveKey]) {
                                dispatch({ type: 'keyboard/initializeKeyParameters', payload: effectiveKey });
                            }
                            
                            dispatch({ 
                                type: 'keyboard/setKeyActiveWaveforms', 
                                payload: { 
                                    keyNumber: effectiveKey, 
                                    activeWaveforms: [...activeWaveforms]
                                } 
                            });
                        }
                        
                        console.log(`[WAVEFORM SYNC] Multi mode (local): Updated key ${effectiveKey} with waveforms: ${keyActiveWaveforms.length > 0 ? keyActiveWaveforms.join(', ') : activeWaveforms.join(', ')}, editable: ${editableWaveform}`);
                    } else {
                        console.warn(`[WAVEFORM SYNC] Multi mode (local): No key to update, skipping waveform change`);
                    }
                    
                    // IMPORTANT: In local mode, don't update the global waveforms
                }
                
                // Always update the global waveforms as a fallback for new keys in global mode only
                if (isGlobalMode) {
                    keyboardAudioManager.setGlobalActiveWaveforms(activeWaveforms);
                }
            }
            
            // Handle direct waveform selection
            if (action.type === toggleWaveform.type) {
                const waveform = action.payload as Waveform;
                
                // When adding a waveform, set it as editable if it's not already in the active waveforms
                if (!activeWaveforms.includes(waveform)) {
                    // This is a newly activated waveform, make it editable
                    console.log(`[WAVEFORM SYNC] Setting ${waveform} as editable waveform`);
                    dispatch(setEditableWaveform(waveform));
                }
                
                // Now check if any oscillators need their waveform type updated
                const voices = Array.from(keyboardAudioManager.getActiveVoices?.() || []);
                voices.forEach(([noteNumber, voice]) => {
                    // Find oscillators that match this waveform type
                    voice.oscillators?.forEach(osc => {
                        // Only update if using AdditiveOscillator
                        if (osc.type === waveform && osc.oscillator instanceof AdditiveOscillator) {
                            // Ensure the oscillator has the correct waveform type
                            const currentType = osc.oscillator.getWaveformType();
                            if (currentType !== waveform) {
                                console.log(`[WAVEFORM SYNC] Updating oscillator waveform type for note ${noteNumber} from ${currentType} to ${waveform}`);
                                osc.oscillator.setWaveformType(waveform);
                            }
                        }
                    });
                });
            }
            
            // Make sure WaveformControls also updates the editable waveform
            if (action.type === 'keyboard/setGlobalWaveform' || action.type === 'keyboard/setKeyWaveform') {
                const waveform = action.type === 'keyboard/setGlobalWaveform' 
                    ? action.payload 
                    : action.payload.waveform;
                    
                console.log(`[WAVEFORM SYNC] Setting ${waveform} as editable from direct waveform selection`);
                dispatch(setEditableWaveform(waveform));
            }
        }
        
        // Add additional case for direct waveform selection (from WaveformControls component)
        if (action.type === 'keyboard/setGlobalWaveform' || action.type === 'keyboard/setKeyWaveform') {
            const waveform = action.type === 'keyboard/setGlobalWaveform' 
                ? action.payload 
                : action.payload.waveform;
                
            console.log(`[WAVEFORM SYNC] Setting ${waveform} as editable from direct waveform selection`);
            dispatch(setEditableWaveform(waveform));
        }
    }
    
    return result; // Return the original action
};

// Combined middleware that includes both audio middleware and waveform middleware
const combinedMiddleware: Middleware<object, RootState> = ({ dispatch, getState }) => next => action => {
    // First run the audio middleware to process the action
    const result = audioMiddleware({ dispatch, getState })(next)(action);
    
    // Then run the waveform middleware on the same action for side effects only
    // Don't pass result here, as we want to process the original action
    waveformMiddleware({ dispatch, getState })(next)(action);
    
    // Return the result from audioMiddleware
    return result;
};

// Export a single middleware
export default combinedMiddleware;