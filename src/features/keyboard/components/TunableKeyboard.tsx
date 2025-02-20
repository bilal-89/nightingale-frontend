import React, { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { Card } from '../../../shared/components/ui/card';
import TunableKey from './TunableKey';
import { OctaveControls } from './OctaveControls';
import {
    noteOn,
    noteOff,
    setKeyParameter,
    setMode,
    setGlobalWaveform,
    togglePanel,
    selectActiveNotes,
    selectParameter,
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
import keyboardAudioManager from '../../../../src/features/audio/engine/synthesis/keyboardEngine';

const waveformLabels: Record<Waveform, string> = {
    sine: "Sine",
    square: "Square",
    sawtooth: "Saw",
    triangle: "Triangle"
};

const modeStyles: Record<SynthMode, {
    background: string;
    containerBg: string;
    buttonBg: string;
    textColor: string;
    shadow: string;
    innerShadow: string;
}> = {
    tunable: {
        background: 'from-[#e5e9ec] to-[#e5e9ec]',
        containerBg: 'bg-[#e5e9ec]',
        buttonBg: 'bg-[#e5e9ec]',
        textColor: 'text-[#4a4543]',
        shadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff',
        innerShadow: 'inset 8px 8px 16px #c8ccd0, inset -8px -8px 16px #ffffff'
    },
    drums: {
        background: 'from-[#e5e9ec] to-[#e5e9ec]',
        containerBg: 'bg-[#e5e9ec]',
        buttonBg: 'bg-[#e5e9ec]',
        textColor: 'text-[#4a4543]',
        shadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff',
        innerShadow: 'inset 8px 8px 16px #c8ccd0, inset -8px -8px 16px #ffffff'
    }
};

const TunableKeyboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const timing = useTiming();
    const activeNotes = useSelector(selectActiveNotes);
    const isInitialized = useSelector(selectIsInitialized);
    const currentMode = useSelector(selectMode);
    const currentWaveform = useSelector(selectGlobalWaveform);
    const isPanelVisible = useSelector(selectIsPanelVisible);
    const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
    const tracks = useSelector((state: RootState) => state.player.tracks);
    const currentTrackColor = tracks[currentTrack]?.color;
    const currentOctave = useSelector(selectCurrentOctave);

    const [isPressed, setIsPressed] = useState(false);
    const [clickedContainer, setClickedContainer] = useState(false);

    const initializeAudio = useCallback(() => {
        if (!isInitialized) {
            dispatch(initializeAudioContext());
        }
    }, [dispatch, isInitialized]);

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

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsPressed(true);
            setClickedContainer(true);
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        if (isPressed && clickedContainer) {
            dispatch(setMode(currentMode === 'tunable' ? 'drums' : 'tunable'));
        }
        setIsPressed(false);
        setClickedContainer(false);
    }, [isPressed, clickedContainer, currentMode, dispatch]);

    const handleMouseLeave = useCallback(() => {
        setIsPressed(false);
        setClickedContainer(false);
    }, []);

    // Update useEffect section in TunableKeyboard.tsx

    // In TunableKeyboard.tsx

// First, let's create a helper function for consistent note calculation
    const getAdjustedNote = (baseNote: number, octave: number) => {
        return baseNote + ((octave - 4) * 12); // Adjust relative to middle octave (4)
    };

// Update useEffect for keyboard events
    useEffect(() => {
        const keyMap: Record<string, number> = {
            'a': 60,  // Middle C
            'w': 61,  // C#
            's': 62,  // D
            'e': 63,  // D#
            'd': 64,  // E
            'f': 65,  // F
            't': 66,  // F#
            'g': 67,  // G
            'y': 68,  // G#
            'h': 69,  // A
            'u': 70,  // A#
            'j': 71   // B
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const baseNote = keyMap[e.key.toLowerCase()];
            if (baseNote !== undefined) {
                const adjustedNote = getAdjustedNote(baseNote, currentOctave);
                handleNoteOn(adjustedNote);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const baseNote = keyMap[e.key.toLowerCase()];
            if (baseNote !== undefined) {
                const adjustedNote = getAdjustedNote(baseNote, currentOctave);
                handleNoteOff(adjustedNote);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleNoteOn, handleNoteOff, currentOctave]);

// Update notes array generation
    const notes = Array.from({ length: 12 }, (_, i) => {
        const baseNote = 60 + i; // Keep base note constant
        const adjustedNote = getAdjustedNote(baseNote, currentOctave);
        return {
            note: adjustedNote,
            frequency: 440 * Math.pow(2, (adjustedNote - 69) / 12)
        };
    });

    const currentStyle = modeStyles[currentMode];

    const getContainerStyle = () => ({
        transition: 'all 200ms ease-in-out',
        boxShadow: isPressed ? currentStyle.innerShadow : currentStyle.shadow,
        transform: isPressed ? 'translateY(1px)' : 'translateY(0)'
    });

    return (
        <Card className={`p-8 bg-gradient-to-br transition-all duration-300 ease-in-out ${currentStyle.background}`}>
            <div className="flex gap-5 ">
                <OctaveControls className=" ml-[-13px]" />
                <div className="flex flex-col gap-1 flex-1">
                    <div
                        className={`
                            grid grid-cols-6 gap-x-24 gap-y-6 p-16 rounded-xl cursor-pointer
                            transition-all duration-90 ease-in-out
                            ${currentStyle.containerBg}
                        `}
                        style={getContainerStyle()}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="contents transition-all duration-100 ease-in-out">
                            {notes.slice(0, 6).map(({note}) => (
                                <div key={note} className="flex justify-center transition-all duration-300 ease-in-out">
                                    <TunableKey
                                        note={note}
                                        isPressed={activeNotes.includes(note)}
                                        tuning={useSelector((state: RootState) =>
                                            selectParameter(state, note, 'tuning'))}
                                        onNoteOn={handleNoteOn}
                                        onNoteOff={handleNoteOff}
                                        onTuningChange={handleTuningChange}
                                        mode={currentMode}
                                        onPanelClick={handlePanelClick}
                                        isPanelVisible={isPanelVisible}
                                        trackColor={currentTrackColor}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="contents transition-all duration-300 ease-in-out">
                            {notes.slice(6, 12).map(({note}) => (
                                <div key={note} className="flex justify-center transition-all duration-300 ease-in-out">
                                    <TunableKey
                                        note={note}
                                        isPressed={activeNotes.includes(note)}
                                        tuning={useSelector((state: RootState) =>
                                            selectParameter(state, note, 'tuning'))}
                                        onNoteOn={handleNoteOn}
                                        onNoteOff={handleNoteOff}
                                        onTuningChange={handleTuningChange}
                                        mode={currentMode}
                                        onPanelClick={handlePanelClick}
                                        isPanelVisible={isPanelVisible}
                                        trackColor={currentTrackColor}
                                    />
                                </div>
                            ))}
                        </div>

                        {currentMode === 'tunable' && (
                            <div className="col-span-6 flex justify-center gap-3 mt-4">
                                {(['sine', 'square', 'sawtooth', 'triangle'] as const).map((waveform) => (
                                    <button
                                        key={waveform}
                                        onClick={() => handleWaveformChange(waveform)}
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
                                        {waveformLabels[waveform]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TunableKeyboard;