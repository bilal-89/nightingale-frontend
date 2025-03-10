// TunableKeyboard.tsx - Updated with Redux layout state and SVG waveform controls
import React, { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { Card } from '../../../shared/components/ui/card';
import { KeyboardLayout } from './KeyboardLayout';
import { OctaveControls } from './OctaveControls';
import WaveformControls from './WaveformControls'; // Import the single waveform component
import MultiWaveformControls from './MultiWaveformControls'; // Import the new multi-waveform component
import {
    noteOn,
    noteOff,
    setKeyParameter,
    setMode,
    setGlobalWaveform,
    togglePanel,
    toggleKeyboardLayout,
    selectActiveNotes,
    selectIsInitialized,
    selectMode,
    selectIsPanelVisible,
    selectGlobalWaveform,
    selectCurrentOctave,
    selectUsingFigmaLayout,
    selectParameterContext,
    selectSelectedKey,
    SynthMode,
    Waveform,
    setParameterContext,
    setKeyWaveform,
    selectKeyWaveform,
    selectIsGlobalOscillatorMode,
    // Add the new selectors
    selectActiveWaveforms,
    selectEditableWaveform,
    setSelectedKey,
    toggleWaveform,
    setEditableWaveform,
    selectOscillatorMode,
} from '../store/slices/keyboard.slice';
import { initializeAudioContext } from '../../audio/store/actions.ts';
import { RootState } from '../../../store';
import { useTiming } from '../../player/hooks/useTiming.ts';
import keyboardAudioManager from '../../audio/engine/synthesis/keyboardEngine';
import {
    KEY_TO_NOTE,
    MODE_STYLES,
    FIGMA_CONTAINER_LAYOUT,
    ORIGINAL_CONTAINER_LAYOUT,
    FIGMA_KEY_DATA,
    ORIGINAL_KEY_DATA
} from '../data/keyboardData';
import OscillatorModeToggle from './OscillatorModeToggle';
import OscillatorTypeToggle from './OscillatorTypeToggle';
import ParameterIndependenceToggle from './ParameterIndependenceToggle';

// Main component
const TunableKeyboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const timing = useTiming();
    const isInitialized = useSelector(selectIsInitialized);
    const currentMode = useSelector(selectMode);
    const globalWaveform = useSelector(selectGlobalWaveform);
    const isPanelVisible = useSelector(selectIsPanelVisible);
    const activeNotes = useSelector(selectActiveNotes);
    
    // Try to get track color, but provide fallbacks in case player state is different
    // than expected - fixing TypeScript errors
    let currentTrackColor: string | undefined;
    try {
        // @ts-ignore - Ignore type errors for now as we're providing fallbacks
        const currentTrack = useSelector((state: RootState) => state.player?.currentTrack);
        // @ts-ignore
        const tracks = useSelector((state: RootState) => state.player?.tracks);
        
        if (currentTrack !== undefined && tracks && tracks[currentTrack]) {
            currentTrackColor = tracks[currentTrack].color;
        }
    } catch (e) {
        console.warn('Could not get track color:', e);
        currentTrackColor = '#B3D94C'; // Default accent color
    }
    
    const currentOctave = useSelector(selectCurrentOctave);
    const usingFigmaLayout = useSelector(selectUsingFigmaLayout);
    const parameterContext = useSelector(selectParameterContext);
    const selectedKey = useSelector(selectSelectedKey);
    const isGlobalOscillatorMode = useSelector(selectIsGlobalOscillatorMode);
    const oscillatorMode = useSelector(selectOscillatorMode);
    
    // Get the appropriate waveform - either for the selected key or global
    const currentWaveform = useSelector((state: RootState) => 
        selectedKey !== null 
            ? selectKeyWaveform(state, selectedKey) 
            : globalWaveform
    );

    // Add logging to track selected key and waveform changes
    useEffect(() => {
        if (selectedKey !== null) {
            console.log(`[TUNABLE KEYBOARD] Selected key changed to: ${selectedKey}`);
            console.log(`[TUNABLE KEYBOARD] Current waveform for selected key: ${currentWaveform}`);
        }
    }, [selectedKey, currentWaveform]);

    // Derive keyboard layout data based on Redux state
    const containerLayout = usingFigmaLayout ? FIGMA_CONTAINER_LAYOUT : ORIGINAL_CONTAINER_LAYOUT;
    const keyData = usingFigmaLayout ? FIGMA_KEY_DATA : ORIGINAL_KEY_DATA;

    // Initialize audio context if needed
    const initializeAudio = useCallback(() => {
        if (!isInitialized) {
            dispatch(initializeAudioContext());
        }
    }, [dispatch, isInitialized]);

    // Note event handlers
    const handleNoteOn = useCallback((note: number) => {
        // Initialize audio before doing anything else
        initializeAudio();
        
        console.log(`[DEBUG] Note on: ${note}`);
        
        // Before dispatching noteOn, select the key explicitly
        // This must happen BEFORE any other actions
        dispatch(setSelectedKey(note));
        console.log(`[DEBUG] Selected key set to: ${note}`);
        
        // Then dispatch noteOn
        dispatch(noteOn(note));
        
        // Force-set the parameter context to keyboard
        dispatch(setParameterContext('keyboard'));
        
        // Always show parameter panel on note press
        if (!isPanelVisible) {
            console.log(`[DEBUG] Opening parameter panel for note ${note}`);
            dispatch(togglePanel());
        }
        
        // Clear any outdated selected key info when pressing a new key
        if (selectedKey !== note) {
            console.log(`[DEBUG] Updating selected key from ${selectedKey} to ${note}`);
            dispatch(setSelectedKey(note));
        }
    }, [dispatch, initializeAudio, isPanelVisible, selectedKey]);

    const handleNoteOff = useCallback((note: number) => {
        dispatch(noteOff(note));
    }, [dispatch]);

    const handleTuningChange = useCallback((note: number, cents: number) => {
        keyboardAudioManager.setNoteParameter(note, 'tuning', cents);
        timing.saveTuningState(note, cents);
        dispatch(setKeyParameter({
            keyNumber: note,
            parameter: 'tuning',
            value: cents
        }));
    }, [dispatch, timing]);

    // Handle waveform changes with more robust tracking of the selected key
    const handleWaveformChange = useCallback((waveform: Waveform) => {
        // Log current state for debugging
        console.log(`[WAVEFORM CHANGE] Mode: ${oscillatorMode}, isGlobalMode: ${isGlobalOscillatorMode}, selectedKey: ${selectedKey}, activeNotes: [${activeNotes.join(', ')}]`);
        
        // Handle traditional single waveform mode differently from multi-waveform
        if (oscillatorMode === 'single') {
            if (isGlobalOscillatorMode) {
                // In global mode, change all keys by updating the global waveform
                dispatch(setGlobalWaveform(waveform));
                console.log(`[DEBUG UI] Setting global waveform to ${waveform} (global mode)`);
            } else {
                // LOCAL MODE LOGIC - NEVER update global waveform in local mode
                
                // First choice: If a key is selected, update that specific key only
                if (selectedKey !== null) {
                    dispatch(setKeyWaveform({ keyNumber: selectedKey, waveform }));
                    console.log(`[DEBUG UI] Setting waveform for selected key ${selectedKey} to ${waveform} (local mode)`);
                }
                // Second choice: If we have active notes but no selected key, update the most recent active note
                else if (activeNotes.length > 0) {
                    const noteToUpdate = activeNotes[activeNotes.length - 1];
                    dispatch(setKeyWaveform({ keyNumber: noteToUpdate, waveform }));
                    console.log(`[DEBUG UI] Setting waveform for active note ${noteToUpdate} to ${waveform} (local mode, from active notes)`);
                    
                    // Also select this key to maintain consistent behavior
                    dispatch(setSelectedKey(noteToUpdate));
                }
                // Last resort: In local mode with no selected key and no active notes, show a notification
                else {
                    console.log(`[DEBUG UI] Cannot set key-specific waveform - no selected key or active notes`);
                    
                    // DO NOT update global waveform in local mode - that's the bug we're fixing
                    
                    // Optional: You could show a temporary message to the user here
                    // For example:
                    // dispatch(setTemporaryMessage('Please select a key or play a note to set its waveform'));
                }
            }
        } else {
            // Multi-oscillator mode
            dispatch(toggleWaveform(waveform));
            dispatch(setEditableWaveform(waveform));
            console.log(`[DEBUG UI] Toggled waveform ${waveform} in multi-oscillator mode`);
        }
    }, [dispatch, selectedKey, isGlobalOscillatorMode, oscillatorMode, activeNotes]);

    const handlePanelClick = useCallback(() => {
        dispatch(togglePanel());
    }, [dispatch]);

    // Container interaction for mode switching
    const handleContainerClick = useCallback(() => {
        dispatch(setMode(currentMode === 'tunable' ? 'drums' : 'tunable'));
    }, [currentMode, dispatch]);

    // Helper function for adjusting notes with octave
    const getAdjustedNote = useCallback((baseNote: number, octave: number) => {
        return baseNote + ((octave - 4) * 12); // Adjust relative to middle octave (4)
    }, []);

    // Create notes array with base note IDs
    const notes = React.useMemo(() => Array.from({ length: 12 }, (_, i) => {
        const baseNote = 60 + i; // Keep base note constant
        const adjustedNote = getAdjustedNote(baseNote, currentOctave);
        return {
            note: adjustedNote,
            baseNote: baseNote, // Store the base note (60-71) for mapping to SVG paths
            frequency: 440 * Math.pow(2, (adjustedNote - 69) / 12)
        };
    }), [currentOctave, getAdjustedNote]);

    // Keyboard event handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if modifier keys are pressed or if the key is already pressed
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
            if (e.repeat) return; // Prevent key repeat

            // Special key for layout toggle - use Tab key
            if (e.key === 'Tab') {
                e.preventDefault();
                dispatch(toggleKeyboardLayout());
                return;
            }

            const note = KEY_TO_NOTE[e.key.toLowerCase()];
            if (note !== undefined) {
                e.preventDefault();
                handleNoteOn(note + (currentOctave - 4) * 12);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            // Skip if modifier keys are pressed
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
            if (e.key === 'Tab') return; // Skip tab key up event

            const note = KEY_TO_NOTE[e.key.toLowerCase()];
            if (note !== undefined) {
                e.preventDefault();
                handleNoteOff(note + (currentOctave - 4) * 12);
            }
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Clean up
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [currentOctave, handleNoteOn, handleNoteOff, dispatch]);

    const currentStyle = MODE_STYLES[currentMode];

    return (
        <Card className="p-4 bg-transparent shadow-none border-none transition-all duration-300 ease-in-out max-w-[800px] mx-auto">
            <div className="flex flex-row gap-6">
                {/* Octave Controls */}
                <div className="flex-none">
                    <div className="p-4">
                        <OctaveControls size={1.8} />
                    </div>
                </div>

                {/* Main Keyboard Area */}
                <div className="flex-1 relative">
                    {/* Keyboard Layout Component with dynamic layout props */}
                    <KeyboardLayout
                        notes={notes}
                        currentMode={currentMode}
                        currentTrackColor={currentTrackColor}
                        isPanelVisible={isPanelVisible}
                        handleNoteOn={handleNoteOn}
                        handleNoteOff={handleNoteOff}
                        handleTuningChange={handleTuningChange}
                        handlePanelClick={handlePanelClick}
                        handleContainerClick={handleContainerClick}
                        containerLayout={containerLayout}
                        keyData={keyData}
                    />

                    {/* Waveform controls - only displayed in tunable mode */}
                    {currentMode === 'tunable' && (
                        <div className="flex justify-center items-end">
                            {/* Conditionally render based on oscillator mode */}
                            {oscillatorMode === 'single' ? (
                                <WaveformControls
                                    currentWaveform={currentWaveform}
                                    onWaveformChange={handleWaveformChange}
                                />
                            ) : (
                                <MultiWaveformControls />
                            )}
                        </div>
                    )}
                    
                    {/* Mode toggle buttons with precise positioning */}
                    {currentMode === 'tunable' && (
                        <>
                            {/* Global/Local Oscillator Mode Toggle */}
                            <div className="absolute" style={{
                                top: '330px',
                                left: '-60px',
                                transform: 'scale(1.4)',
                                zIndex: 10
                            }}>
                                <OscillatorModeToggle />
                            </div>
                            
                            {/* 
                              Positioning adjustment:
                              - 'top' controls vertical position (higher number = lower on screen)
                              - 'right' controls horizontal position (lower number = farther right)
                              - 'transform: scale()' controls the size (1.0 = original size)
                            */}
                            <div className="absolute" style={{
                                top: '330px',
                                right: '-56px',
                                transform: 'scale(1.4)',
                                zIndex: 10
                            }}>
                                <OscillatorTypeToggle />
                            </div>
                            
                            {/* Parameter Independence Toggle - Only show when in multi oscillator mode */}
                            {oscillatorMode === 'multi' && (
                                <div className="absolute" style={{
                                    top: '370px',
                                    right: '-56px',
                                    transform: 'scale(1.4)',
                                    zIndex: 10
                                }}>
                                    <ParameterIndependenceToggle />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default TunableKeyboard;