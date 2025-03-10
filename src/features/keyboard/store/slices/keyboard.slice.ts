import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type ParameterContext = 'keyboard' | 'note';

// Define structure for oscillator state
export interface OscillatorState {
    waveform: Waveform;
    enabled: boolean;
    id: string;
}

// Define the structure for a single parameter
export interface Parameter {
    value: number;
    defaultValue: number;
}

// Define structure for oscillator-specific parameters
export interface OscillatorParameters {
    // ADSR envelope parameters
    attack?: Parameter;
    decay?: Parameter;
    sustain?: Parameter;
    release?: Parameter;
    filterCutoff?: Parameter;
    filterResonance?: Parameter;
    
    // Additional parameters that could be per-oscillator
    unisonCount?: Parameter;
    unisonDetune?: Parameter;
    unisonWidth?: Parameter;
}

// Define the structure for all parameters of a key
export interface KeyParameters {
    // Core parameters that always apply to the whole key
    tuning?: Parameter;
    velocity?: Parameter;
    warbleRate?: Parameter;
    warbleDepth?: Parameter;
    waveform?: Waveform;  // Parameter for per-key waveform

    // ADSR envelope parameters (shared by default)
    attack?: Parameter;
    decay?: Parameter;
    sustain?: Parameter;
    release?: Parameter;
    filterCutoff?: Parameter;
    filterResonance?: Parameter;
    
    // Unison parameters (shared by default)
    unisonCount?: Parameter;
    unisonDetune?: Parameter;
    unisonWidth?: Parameter;
    
    // New field for multi-oscillator support
    activeWaveforms?: Waveform[]; // Store active waveforms per key
    
    // New field for per-oscillator parameters when in independent mode
    // This is a map of waveform type to its parameters
    oscillatorParameters?: {
        sine?: Partial<OscillatorParameters>;
        square?: Partial<OscillatorParameters>;
        sawtooth?: Partial<OscillatorParameters>;
        triangle?: Partial<OscillatorParameters>;
    };

    // Shared harmonics for all oscillators on this key
    harmonics?: HarmonicSettings;
    
    // Per-oscillator harmonic settings
    oscillatorHarmonics?: Record<Waveform, HarmonicSettings>;
}

export type SynthMode = 'tunable' | 'drums';
export type OscillatorMode = 'single' | 'multi'; // New type for oscillator mode

export interface HarmonicSettings {
    // Amplitude values (0-100) for each harmonic partial
    amplitudes: number[]; // Array of 8 values for harmonics 1-8
}

export interface KeyboardState {
    activeNotes: number[];
    selectedKey: number | null;  // Tracks which key's parameters are being shown
    keyParameters: Record<number, Partial<KeyParameters>>;
    baseOctave: number;
    isInitialized: boolean;
    mode: SynthMode;
    isParameterPanelVisible: boolean;
    globalWaveform: Waveform;  // Global waveform setting
    parameterContext: ParameterContext;  // New field for context tracking
    currentOctave: number;     // Added for octave control
    minOctave: number;         // Added for octave control
    maxOctave: number;         // Added for octave control
    usingFigmaLayout: boolean; // Add this new property for layout toggle
    isGlobalOscillatorMode: boolean; // Whether oscillator changes apply to all keys
    
    // Add new fields for multi-oscillator support
    activeWaveforms: Waveform[]; // Currently active waveforms
    editableWaveform: Waveform | null; // Currently editable waveform
    
    // New field to toggle between single and multi oscillator modes
    oscillatorMode: OscillatorMode;
    
    // New field to toggle between shared and independent parameters for oscillators
    isIndependentParameterMode: boolean;

    // Global harmonic settings by waveform type
    globalHarmonics: Record<Waveform, HarmonicSettings>;
    
    // Toggle for harmonic panel visibility
    isHarmonicPanelVisible: boolean;
}

const defaultParameters: KeyParameters = {
    tuning: { value: 0, defaultValue: 0 },
    velocity: { value: 100, defaultValue: 100 },
    warbleRate: { value: 5, defaultValue: 5 },
    warbleDepth: { value: 30, defaultValue: 30 },
    attack: { value: 50, defaultValue: 50 },
    decay: { value: 100, defaultValue: 100 },
    sustain: { value: 70, defaultValue: 70 },
    release: { value: 150, defaultValue: 150 },
    filterCutoff: { value: 20000, defaultValue: 20000 },
    filterResonance: { value: 0.707, defaultValue: 0.707 },
    
    // Add unison default parameters
    unisonCount: { value: 1, defaultValue: 1 },
    unisonDetune: { value: 10, defaultValue: 10 },
    unisonWidth: { value: 50, defaultValue: 50 }
};

const initialState: KeyboardState = {
    activeNotes: [],
    selectedKey: null,
    keyParameters: {},
    baseOctave: 4,
    isInitialized: false,
    mode: 'tunable',
    isParameterPanelVisible: false,
    globalWaveform: 'sine',
    parameterContext: 'keyboard',  // Default context
    currentOctave: 4,              // Added for octave control
    minOctave: 0,                  // Added for octave control
    maxOctave: 8,                  // Added for octave control
    usingFigmaLayout: false,       // Changed to false to default to original layout
    isGlobalOscillatorMode: false, // Default to local mode
    
    // Initialize with sine wave active and editable
    activeWaveforms: ['sine'],
    editableWaveform: 'sine',
    
    // Default to single oscillator mode for backward compatibility
    oscillatorMode: 'single',
    
    // Default to shared parameters mode for backward compatibility
    isIndependentParameterMode: false,

    // Initialize default harmonic settings for each waveform
    globalHarmonics: {
        sine: { amplitudes: [100, 0, 0, 0, 0, 0, 0, 0] },
        square: { amplitudes: [100, 0, 0, 0, 0, 0, 0, 0] },
        triangle: { amplitudes: [100, 0, 0, 0, 0, 0, 0, 0] },
        sawtooth: { amplitudes: [100, 0, 0, 0, 0, 0, 0, 0] }
    },
    isHarmonicPanelVisible: true,
};

const keyboardSlice = createSlice({
    name: 'keyboard',
    initialState,
    reducers: {
        initializeAudio: (state) => {
            state.isInitialized = true;
        },

        noteOn: (state, action: PayloadAction<number>) => {
            const note = action.payload;
            if (!state.activeNotes.includes(note)) {
                state.activeNotes.push(note);
                // If panel is visible and in keyboard context, update selected key
                if (state.isParameterPanelVisible && state.parameterContext === 'keyboard') {
                    state.selectedKey = note;
                }
            }
        },

        noteOff: (state, action: PayloadAction<number>) => {
            const note = action.payload;
            state.activeNotes = state.activeNotes.filter(n => n !== note);
        },

        togglePanel: (state) => {
            state.isParameterPanelVisible = !state.isParameterPanelVisible;
            // If hiding panel, reset context and selection
            if (!state.isParameterPanelVisible) {
                state.selectedKey = null;
                state.parameterContext = 'keyboard';
            }
        },

        setParameterContext: (state, action: PayloadAction<ParameterContext>) => {
            state.parameterContext = action.payload;
            // Clear selected key when switching to note context
            if (action.payload === 'note') {
                state.selectedKey = null;
            }
        },

        setKeyParameter: (state, action: PayloadAction<{
            keyNumber: number;
            parameter: keyof KeyParameters;
            value: number;
        }>) => {
            const { keyNumber, parameter, value } = action.payload;

            if (!state.keyParameters[keyNumber]) {
                state.keyParameters[keyNumber] = {};
            }

            if (!state.keyParameters[keyNumber][parameter]) {
                state.keyParameters[keyNumber][parameter] = {
                    value: defaultParameters[parameter].defaultValue,
                    defaultValue: defaultParameters[parameter].defaultValue
                };
            }

            state.keyParameters[keyNumber][parameter]!.value = value;
        },

        setOscillatorParameter: (state, action: PayloadAction<{
            keyNumber: number;
            waveform: Waveform;
            parameter: string;
            value: number;
        }>) => {
            const { keyNumber, waveform, parameter, value } = action.payload;

            // Ensure the key parameters exist
            if (!state.keyParameters[keyNumber]) {
                state.keyParameters[keyNumber] = {};
            }

            // Ensure the oscillatorParameters map exists
            if (!state.keyParameters[keyNumber].oscillatorParameters) {
                state.keyParameters[keyNumber].oscillatorParameters = {};
            }

            // Ensure the waveform entry exists in oscillatorParameters
            if (!state.keyParameters[keyNumber].oscillatorParameters![waveform]) {
                state.keyParameters[keyNumber].oscillatorParameters![waveform] = {};
            }

            // Create the parameter if it doesn't exist
            const defaultValue = defaultParameters[parameter as keyof typeof defaultParameters]?.defaultValue ?? 0;
            
            if (!state.keyParameters[keyNumber].oscillatorParameters![waveform]![parameter as keyof OscillatorParameters]) {
                (state.keyParameters[keyNumber].oscillatorParameters![waveform] as any)[parameter] = {
                    value: defaultValue,
                    defaultValue: defaultValue
                };
            }

            // Update the parameter value
            (state.keyParameters[keyNumber].oscillatorParameters![waveform] as any)[parameter].value = value;
        },

        setGlobalWaveform: (state, action: PayloadAction<Waveform>) => {
            state.globalWaveform = action.payload;
        },

        setKeyWaveform: (state, action: PayloadAction<{ keyNumber: number; waveform: Waveform }>) => {
            const { keyNumber, waveform } = action.payload;
            
            // Make sure the key exists in state
            if (!state.keyParameters[keyNumber]) {
                state.keyParameters[keyNumber] = {};
            }
            
            // Update the waveform
            state.keyParameters[keyNumber].waveform = waveform;
            
            // If this is the currently selected key, also update the editable waveform
            if (state.selectedKey === keyNumber) {
                state.editableWaveform = waveform;
            }
        },

        setSelectedKey: (state, action: PayloadAction<number | null>) => {
            state.selectedKey = action.payload;
            
            // Update context and panel visibility when selecting a key
            if (action.payload !== null) {
                state.parameterContext = 'keyboard';
                state.isParameterPanelVisible = true;
                
                // If a key is selected, update the editable waveform to match the key's waveform
                const keyWaveform = state.keyParameters[action.payload]?.waveform;
                console.log(`[KEYBOARD SLICE] Key ${action.payload} selected, key waveform:`, keyWaveform);
                console.log(`[KEYBOARD SLICE] Current editable waveform before update:`, state.editableWaveform);
                
                if (keyWaveform) {
                    // Update the editable waveform to match the selected key's waveform
                    state.editableWaveform = keyWaveform;
                    console.log(`[KEYBOARD SLICE] Updated editable waveform to:`, keyWaveform);
                } else {
                    // If the key doesn't have a custom waveform, use the global waveform
                    state.editableWaveform = state.globalWaveform;
                    console.log(`[KEYBOARD SLICE] Key has no custom waveform, updated editable waveform to global:`, state.globalWaveform);
                }
            } else if (state.parameterContext === 'keyboard') {
                state.isParameterPanelVisible = false;
            }
        },

        resetKeyParameters: (state, action: PayloadAction<number>) => {
            const keyNumber = action.payload;
            delete state.keyParameters[keyNumber];
            if (state.selectedKey === keyNumber) {
                state.selectedKey = null;
            }
        },

        resetAllParameters: (state) => {
            state.keyParameters = {};
            state.selectedKey = null;
        },

        setMode: (state, action: PayloadAction<SynthMode>) => {
            state.mode = action.payload;
            state.activeNotes = [];
            state.selectedKey = null;
            state.parameterContext = 'keyboard';
        },

        // New octave control reducers
        incrementOctave: (state) => {
            if (state.currentOctave < state.maxOctave) {
                state.currentOctave += 1;
            }
        },

        decrementOctave: (state) => {
            if (state.currentOctave > state.minOctave) {
                state.currentOctave -= 1;
            }
        },

        setOctave: (state, action: PayloadAction<number>) => {
            const octave = Math.min(Math.max(action.payload, state.minOctave), state.maxOctave);
            state.currentOctave = octave;
        },

        toggleKeyboardLayout: (state) => {
            state.usingFigmaLayout = !state.usingFigmaLayout;
        },

        toggleOscillatorMode: (state) => {
            state.isGlobalOscillatorMode = !state.isGlobalOscillatorMode;
        },

        toggleOscillatorType: (state) => {
            // Toggle between single and multi
            state.oscillatorMode = state.oscillatorMode === 'single' ? 'multi' : 'single';
            
            // When switching to single mode from multi mode
            if (state.oscillatorMode === 'single') {
                // Keep only the editable waveform (or the first one if none is editable)
                const waveformToKeep = state.editableWaveform || state.activeWaveforms[0] || 'sine';
                state.activeWaveforms = [waveformToKeep];
                state.editableWaveform = waveformToKeep;
                
                // Only update the global waveform if in global mode
                // This is important to prevent losing per-key waveform settings in local mode
                if (state.isGlobalOscillatorMode) {
                    state.globalWaveform = waveformToKeep;
                }
            }
            
            // When switching to multi mode from single mode
            else {
                // If there's only one active waveform (from single mode),
                // make sure it's in the activeWaveforms array
                const currentWaveform = state.globalWaveform;
                if (!state.activeWaveforms.includes(currentWaveform)) {
                    state.activeWaveforms = [currentWaveform];
                    state.editableWaveform = currentWaveform;
                }
            }
        },

        toggleParameterIndependence: (state) => {
            // Toggle between shared and independent parameter modes
            state.isIndependentParameterMode = !state.isIndependentParameterMode;
            
            // When switching to shared mode, we may want to consolidate parameters
            // but for now, we'll just toggle the state
        },

        cleanup: (state) => {
            state.activeNotes = [];
            state.isInitialized = false;
            state.selectedKey = null;
            state.isParameterPanelVisible = false;
            state.parameterContext = 'keyboard';
            state.currentOctave = initialState.currentOctave;  // Reset octave on cleanup
        },

        // Batch parameter update for multiple notes
        setBatchParameters: (state, action: PayloadAction<{
            notes: number[];
            parameter: keyof KeyParameters;
            value: number;
        }>) => {
            const { notes, parameter, value } = action.payload;
            
            // Update each of the specified notes
            notes.forEach(noteNumber => {
                if (!state.keyParameters[noteNumber]) {
                    state.keyParameters[noteNumber] = {};
                }

                if (!state.keyParameters[noteNumber][parameter]) {
                    state.keyParameters[noteNumber][parameter] = {
                        value: defaultParameters[parameter]?.defaultValue ?? 0,
                        defaultValue: defaultParameters[parameter]?.defaultValue ?? 0
                    };
                }

                if (state.keyParameters[noteNumber][parameter]) {
                    state.keyParameters[noteNumber][parameter]!.value = value;
                }
            });
        },

        // Batch update for oscillator parameters across multiple notes
        updateOscillatorBatch: (state, action: PayloadAction<{
            notes: number[];
            oscillatorIndex: number;
            changes: Partial<OscillatorState>;
        }>) => {
            const { notes, oscillatorIndex, changes } = action.payload;
            
            notes.forEach(noteNumber => {
                // Check if the note has custom oscillators
                if (state.keyParameters[noteNumber]?.oscillators && 
                    state.keyParameters[noteNumber].oscillators![oscillatorIndex]) {
                    
                    // Update the oscillator parameters
                    state.keyParameters[noteNumber].oscillators![oscillatorIndex] = {
                        ...state.keyParameters[noteNumber].oscillators![oscillatorIndex],
                        ...changes
                    };
                } else if (changes.waveform && oscillatorIndex === 0) {
                    // If this is the main oscillator (index 0) and it doesn't exist yet,
                    // fall back to updating the key's waveform
                    if (!state.keyParameters[noteNumber]) {
                        state.keyParameters[noteNumber] = {};
                    }
                    state.keyParameters[noteNumber].waveform = changes.waveform;
                }
            });
        },

        // Initialize key parameters if they don't exist
        initializeKeyParameters: (state, action: PayloadAction<number>) => {
            const keyNumber = action.payload;
            if (!state.keyParameters[keyNumber]) {
                state.keyParameters[keyNumber] = {};
            }
        },
        
        // Set active waveforms for a specific key
        setKeyActiveWaveforms: (state, action: PayloadAction<{
            keyNumber: number;
            activeWaveforms: Waveform[];
        }>) => {
            const { keyNumber, activeWaveforms } = action.payload;
            
            // Make sure the key parameters exist
            if (!state.keyParameters[keyNumber]) {
                state.keyParameters[keyNumber] = {};
            }
            
            // Set the active waveforms for this key
            state.keyParameters[keyNumber].activeWaveforms = [...activeWaveforms];
            
            console.log(`[REDUX] Set active waveforms for key ${keyNumber}: ${activeWaveforms.join(', ')}`);
        },

        // Add new reducers for multi-waveform support
        toggleWaveform: (state, action: PayloadAction<Waveform>) => {
            const waveform = action.payload;
            
            // Handle global vs. local mode differently
            if (state.isGlobalOscillatorMode) {
                // GLOBAL MODE: Update the global active waveforms array
                
                // If waveform is already active, remove it unless it's the only one
                if (state.activeWaveforms.includes(waveform)) {
                    // Don't remove if it's the only active waveform
                    if (state.activeWaveforms.length > 1) {
                        state.activeWaveforms = state.activeWaveforms.filter(w => w !== waveform);
                        
                        // If the removed waveform was the editable one, make the first active waveform editable
                        if (state.editableWaveform === waveform) {
                            state.editableWaveform = state.activeWaveforms[0];
                        }
                    }
                } else {
                    // Add the waveform to active waveforms
                    state.activeWaveforms.push(waveform);
                    
                    // If this is the first active waveform, make it editable
                    if (state.activeWaveforms.length === 1) {
                        state.editableWaveform = waveform;
                    }
                }
            } else {
                // LOCAL MODE: Update the active waveforms for the selected key or most recent active note
                const selectedKey = state.selectedKey;
                const effectiveKey = selectedKey !== null 
                    ? selectedKey 
                    : state.activeNotes.length > 0 
                        ? state.activeNotes[state.activeNotes.length - 1] 
                        : null;
                
                // Only proceed if we have a key to work with
                if (effectiveKey !== null) {
                    // Make sure the key parameters exist
                    if (!state.keyParameters[effectiveKey]) {
                        state.keyParameters[effectiveKey] = {};
                    }
                    
                    // Initialize activeWaveforms if needed
                    if (!state.keyParameters[effectiveKey].activeWaveforms) {
                        // Start with the global active waveforms
                        state.keyParameters[effectiveKey].activeWaveforms = [...state.activeWaveforms];
                    }
                    
                    // Get reference to the current activeWaveforms array for this key
                    const keyActiveWaveforms = state.keyParameters[effectiveKey].activeWaveforms!;
                    
                    // Toggle the waveform using the same logic as for global mode
                    if (keyActiveWaveforms.includes(waveform)) {
                        // Don't remove if it's the only active waveform
                        if (keyActiveWaveforms.length > 1) {
                            state.keyParameters[effectiveKey].activeWaveforms = 
                                keyActiveWaveforms.filter(w => w !== waveform);
                            
                            // If the removed waveform was the editable one, make the first active waveform editable
                            if (state.editableWaveform === waveform) {
                                state.editableWaveform = state.keyParameters[effectiveKey].activeWaveforms![0];
                            }
                        }
                    } else {
                        // Add the waveform
                        state.keyParameters[effectiveKey].activeWaveforms!.push(waveform);
                        
                        // If this is the first active waveform, make it editable
                        if (state.keyParameters[effectiveKey].activeWaveforms!.length === 1) {
                            state.editableWaveform = waveform;
                        }
                    }
                    
                    // For debugging
                    console.log(`[REDUX] Toggled waveform ${waveform} for key ${effectiveKey}, 
                        active waveforms: ${state.keyParameters[effectiveKey].activeWaveforms!.join(', ')}`);
                } else {
                    // No key selected or active - just update the global state as a fallback
                    // This shouldn't normally happen if the UI is working correctly
                    console.warn(`[REDUX] No key selected or active, using global state as fallback`);
                    
                    // Default to the global logic
                    if (state.activeWaveforms.includes(waveform)) {
                        if (state.activeWaveforms.length > 1) {
                            state.activeWaveforms = state.activeWaveforms.filter(w => w !== waveform);
                            if (state.editableWaveform === waveform) {
                                state.editableWaveform = state.activeWaveforms[0];
                            }
                        }
                    } else {
                        state.activeWaveforms.push(waveform);
                        if (state.activeWaveforms.length === 1) {
                            state.editableWaveform = waveform;
                        }
                    }
                }
            }
        },
        
        setEditableWaveform: (state, action: PayloadAction<Waveform>) => {
            const waveform = action.payload;
            
            // Handle differently depending on mode
            if (state.isGlobalOscillatorMode) {
                // GLOBAL MODE: Use the global active waveforms
                
                // Only set if the waveform is active
                if (state.activeWaveforms.includes(waveform)) {
                    state.editableWaveform = waveform;
                } else {
                    // If not active, add it and make it editable
                    state.activeWaveforms.push(waveform);
                    state.editableWaveform = waveform;
                }
            } else {
                // LOCAL MODE: Use key-specific active waveforms
                const selectedKey = state.selectedKey;
                const effectiveKey = selectedKey !== null 
                    ? selectedKey 
                    : state.activeNotes.length > 0 
                        ? state.activeNotes[state.activeNotes.length - 1] 
                        : null;
                
                if (effectiveKey !== null) {
                    // Make sure the key parameters exist
                    if (!state.keyParameters[effectiveKey]) {
                        state.keyParameters[effectiveKey] = {};
                    }
                    
                    // Initialize activeWaveforms if needed
                    if (!state.keyParameters[effectiveKey].activeWaveforms) {
                        // Start with the global active waveforms
                        state.keyParameters[effectiveKey].activeWaveforms = [...state.activeWaveforms];
                    }
                    
                    // Check if the waveform is in the key's active waveforms
                    const keyActiveWaveforms = state.keyParameters[effectiveKey].activeWaveforms!;
                    
                    if (keyActiveWaveforms.includes(waveform)) {
                        state.editableWaveform = waveform;
                    } else {
                        // If not active, add it and make it editable
                        state.keyParameters[effectiveKey].activeWaveforms!.push(waveform);
                        state.editableWaveform = waveform;
                    }
                    
                    console.log(`[REDUX] Set editable waveform to ${waveform} for key ${effectiveKey}`);
                } else {
                    // No key selected, fall back to global behavior
                    console.warn(`[REDUX] No key selected for setEditableWaveform, using global state`);
                    
                    if (state.activeWaveforms.includes(waveform)) {
                        state.editableWaveform = waveform;
                    } else {
                        state.activeWaveforms.push(waveform);
                        state.editableWaveform = waveform;
                    }
                }
            }
        },

        // Set all harmonics for a specific waveform
        setHarmonics: (state, action: PayloadAction<{
            waveform: Waveform;
            harmonics: number[];
            keyNumber?: number; // Optional - if provided, sets for specific key
        }>) => {
            const { waveform, harmonics, keyNumber } = action.payload;
            
            if (keyNumber !== undefined) {
                // Per-key harmonics
                if (!state.keyParameters[keyNumber]) {
                    state.keyParameters[keyNumber] = {};
                }
                
                if (state.isIndependentParameterMode) {
                    // Per-oscillator harmonics
                    if (!state.keyParameters[keyNumber].oscillatorHarmonics) {
                        state.keyParameters[keyNumber].oscillatorHarmonics = {} as Record<Waveform, HarmonicSettings>;
                    }
                    
                    state.keyParameters[keyNumber].oscillatorHarmonics![waveform] = {
                        amplitudes: [...harmonics]
                    };
                } else {
                    // Shared harmonics for this key
                    state.keyParameters[keyNumber].harmonics = {
                        amplitudes: [...harmonics]
                    };
                }
            } else {
                // Global harmonics
                state.globalHarmonics[waveform] = {
                    amplitudes: [...harmonics]
                };
            }
        },
        
        // Set a single harmonic amplitude
        setHarmonicAmplitude: (state, action: PayloadAction<{
            waveform: Waveform;
            harmonicIndex: number; // 0-7 (for harmonics 1-8)
            value: number; // 0-100
            keyNumber?: number; // Optional - if provided, sets for specific key
        }>) => {
            const { waveform, harmonicIndex, value, keyNumber } = action.payload;
            
            // Helper function to get and update harmonics
            const updateHarmonics = (currentSettings: HarmonicSettings | undefined, defaultSettings: HarmonicSettings) => {
                // Use existing settings or clone the default
                const harmonics = currentSettings?.amplitudes 
                    ? [...currentSettings.amplitudes] 
                    : [...defaultSettings.amplitudes];
                
                // Update the specific harmonic amplitude
                if (harmonicIndex >= 0 && harmonicIndex < harmonics.length) {
                    harmonics[harmonicIndex] = value;
                }
                
                return harmonics;
            };
            
            if (keyNumber !== undefined) {
                // Per-key harmonics
                if (!state.keyParameters[keyNumber]) {
                    state.keyParameters[keyNumber] = {};
                }
                
                if (state.isIndependentParameterMode) {
                    // Per-oscillator harmonics
                    if (!state.keyParameters[keyNumber].oscillatorHarmonics) {
                        state.keyParameters[keyNumber].oscillatorHarmonics = {} as Record<Waveform, HarmonicSettings>;
                    }
                    
                    const currentSettings = state.keyParameters[keyNumber].oscillatorHarmonics![waveform];
                    const updatedHarmonics = updateHarmonics(currentSettings, state.globalHarmonics[waveform]);
                    
                    state.keyParameters[keyNumber].oscillatorHarmonics![waveform] = {
                        amplitudes: updatedHarmonics
                    };
                } else {
                    // Shared harmonics for this key
                    const currentSettings = state.keyParameters[keyNumber].harmonics;
                    const updatedHarmonics = updateHarmonics(currentSettings, state.globalHarmonics[waveform]);
                    
                    state.keyParameters[keyNumber].harmonics = {
                        amplitudes: updatedHarmonics
                    };
                }
            } else {
                // Global harmonics
                const currentSettings = state.globalHarmonics[waveform];
                const updatedHarmonics = updateHarmonics(currentSettings, currentSettings);
                
                state.globalHarmonics[waveform] = {
                    amplitudes: updatedHarmonics
                };
            }
        },
        
        // Toggle the harmonic panel visibility
        toggleHarmonicPanel: (state) => {
            state.isHarmonicPanelVisible = !state.isHarmonicPanelVisible;
        },
    }
});

export const {
    initializeAudio,
    noteOn,
    noteOff,
    togglePanel,
    setParameterContext,
    setKeyParameter,
    setOscillatorParameter,
    setGlobalWaveform,
    setKeyWaveform,
    setSelectedKey,
    resetKeyParameters,
    resetAllParameters,
    setMode,
    incrementOctave,
    decrementOctave,
    setOctave,
    toggleKeyboardLayout,
    toggleOscillatorMode,
    toggleOscillatorType,
    toggleParameterIndependence,
    cleanup,
    setBatchParameters,
    updateOscillatorBatch,
    initializeKeyParameters,
    toggleWaveform,
    setEditableWaveform,
    setKeyActiveWaveforms,
    setHarmonics,
    setHarmonicAmplitude,
    toggleHarmonicPanel,
} = keyboardSlice.actions;

// Selectors
export const selectActiveNotes = (state: { keyboard: KeyboardState }) =>
    state.keyboard.activeNotes;

export const selectSelectedKey = (state: { keyboard: KeyboardState }) =>
    state.keyboard.selectedKey;

export const selectIsPanelVisible = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isParameterPanelVisible;

export const selectParameterContext = (state: { keyboard: KeyboardState }) =>
    state.keyboard.parameterContext;

export const selectKeyParameters = (state: { keyboard: KeyboardState }, keyNumber: number) =>
    state.keyboard.keyParameters[keyNumber] ?? {};

export const selectParameter = (
    state: { keyboard: KeyboardState },
    keyNumber: number,
    parameter: keyof typeof defaultParameters
) => {
    // Handle special case for waveform
    if (parameter === 'waveform') {
        return state.keyboard.keyParameters[keyNumber]?.waveform ?? state.keyboard.globalWaveform;
    }
    
    // Regular parameter access
    const paramValue = (state.keyboard.keyParameters[keyNumber] as any)?.[parameter];
    return paramValue?.value ?? defaultParameters[parameter]?.defaultValue ?? 0;
};

export const selectGlobalWaveform = (state: { keyboard: KeyboardState }) =>
    state.keyboard.globalWaveform;

export const selectKeyWaveform = (state: { keyboard: KeyboardState }, keyNumber: number) =>
    state.keyboard.keyParameters[keyNumber]?.waveform ?? state.keyboard.globalWaveform;

export const selectIsInitialized = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isInitialized;

export const selectBaseOctave = (state: { keyboard: KeyboardState }) =>
    state.keyboard.baseOctave;

export const selectMode = (state: { keyboard: KeyboardState }) =>
    state.keyboard.mode;

// Added for octave control
export const selectCurrentOctave = (state: { keyboard: KeyboardState }) =>
    state.keyboard.currentOctave;

export const selectUsingFigmaLayout = (state: { keyboard: KeyboardState }) =>
    state.keyboard.usingFigmaLayout;

export const selectIsGlobalOscillatorMode = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isGlobalOscillatorMode;

export const selectActiveWaveforms = (state: { keyboard: KeyboardState }) =>
    state.keyboard.activeWaveforms;

export const selectEditableWaveform = (state: { keyboard: KeyboardState }) =>
    state.keyboard.editableWaveform;

export const selectOscillatorMode = (state: { keyboard: KeyboardState }) =>
    state.keyboard.oscillatorMode;

export const selectIsIndependentParameterMode = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isIndependentParameterMode;

export const selectGlobalHarmonics = (state: { keyboard: KeyboardState }) =>
    state.keyboard.globalHarmonics;

export const selectIsHarmonicPanelVisible = (state: { keyboard: KeyboardState }) =>
    state.keyboard.isHarmonicPanelVisible;

export default keyboardSlice.reducer;