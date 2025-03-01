// TunableKeyboard.tsx - Refactored to use extracted components
import React, { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { Card } from '../../../shared/components/ui/card';
import { KeyboardLayout } from './KeyboardLayout';
import { OctaveControls } from './OctaveControls';
import {
    noteOn,
    noteOff,
    setKeyParameter,
    setMode,
    setGlobalWaveform,
    togglePanel,
    selectActiveNotes,
    selectIsInitialized,
    selectMode,
    selectIsPanelVisible,
    selectGlobalWaveform,
    selectCurrentOctave,
    SynthMode,
    Waveform
} from '../store/slices/keyboard.slice';
import { initializeAudioContext } from '../../audio/store/actions.ts';
import { RootState } from '../../../store';
import { useTiming } from '../../player/hooks/useTiming.ts';
import keyboardAudioManager from '../../audio/engine/synthesis/keyboardEngine';
import { KEY_TO_NOTE, WAVEFORM_LABELS, MODE_STYLES, CONTAINER_LAYOUT } from '../data/keyboardData';
// Main component
const TunableKeyboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const timing = useTiming();
    const isInitialized = useSelector(selectIsInitialized);
    const currentMode = useSelector(selectMode);
    const currentWaveform = useSelector(selectGlobalWaveform);
    const isPanelVisible = useSelector(selectIsPanelVisible);
    const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
    const tracks = useSelector((state: RootState) => state.player.tracks);
    const currentTrackColor = tracks[currentTrack]?.color;
    const currentOctave = useSelector(selectCurrentOctave);

    const [isContainerPressed, setIsContainerPressed] = useState(false);

    // Initialize audio context if needed
    const initializeAudio = useCallback(() => {
        if (!isInitialized) {
            dispatch(initializeAudioContext());
        }
    }, [dispatch, isInitialized]);

    // Note event handlers
    const handleNoteOn = useCallback((note: number) => {
        initializeAudio();
        dispatch(noteOn(note));
    }, [dispatch, initializeAudio]);

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

    const handleWaveformChange = useCallback((newWaveform: Waveform) => {
        dispatch(setGlobalWaveform(newWaveform));
    }, [dispatch]);

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

            const note = KEY_TO_NOTE[e.key.toLowerCase()];
            if (note !== undefined) {
                e.preventDefault();
                handleNoteOn(note + (currentOctave - 4) * 12);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            // Skip if modifier keys are pressed
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

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
    }, [currentOctave, handleNoteOn, handleNoteOff]);

    const currentStyle = MODE_STYLES[currentMode];

    return (
        <Card className={`p-8 bg-gradient-to-br transition-all duration-300 ease-in-out ${currentStyle.background}`}>
            <div className="flex flex-row gap-6">
                {/* Octave Controls */}
                <div className="flex-none">
                    <OctaveControls className="p-4" />
                </div>

                {/* Main Keyboard Area */}
                <div className="flex-1 relative">
                    {/* Keyboard Layout Component */}
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
                        isContainerPressed={isContainerPressed}
                    />

                    {/* Waveform controls - only displayed in tunable mode */}
                    {currentMode === 'tunable' && (
                        <div className="flex justify-center gap-3 mt-4">
                            {(['sine', 'square', 'sawtooth', 'triangle'] as const).map((waveform) => (
                                <button
                                    key={waveform}
                                    onClick={() => handleWaveformChange(waveform as Waveform)}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm
                                        transition-all duration-300 ease-in-out
                                        ${currentWaveform === waveform
                                        ? 'bg-[#e8e4dc] shadow-lg scale-105'
                                        : 'bg-[#f0ece6] opacity-70 scale-100'
                                    }
                                        text-[#4a4543]
                                        hover:opacity-90
                                    `}
                                    style={{
                                        boxShadow: currentWaveform === waveform
                                            ? '3px 3px 6px #d1cdc4, -3px -3px 6px #ffffff'
                                            : 'none'
                                    }}
                                >
                                    {WAVEFORM_LABELS[waveform as Waveform]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default TunableKeyboard;