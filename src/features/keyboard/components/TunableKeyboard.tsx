import React, { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { Card } from '../../../components/ui/card';
import TunableKey from './TunableKey';
import {
    noteOn,
    noteOff,
    setTuning,
    setMode,
    selectActiveNotes,
    selectTuning,
    selectIsInitialized,
    selectMode,
    SynthMode
} from '../../../store/slices/keyboard/keyboard.slice';
import { initializeAudioContext } from '../../../store/middleware/keyboardAudio.middleware';

// Display labels for each synthesis mode - these are the names shown in the UI
const modeLabels: Record<SynthMode, string> = {
    tunable: "Flute",
    drums: "Drums"
};

// Mode-specific styles for our neumorphic design system
const modeStyles: Record<SynthMode, {
    background: string;
    containerBg: string;
    buttonBg: string;
    textColor: string;
    shadow: string;
    innerShadow: string;
}> = {
    tunable: {
        background: 'from-[#f5f2ed] to-[#e8e4df]',
        containerBg: 'bg-[#f0ece6]',
        buttonBg: 'bg-[#e8e4dc]',
        textColor: 'text-[#4a4543]',
        shadow: '3px 3px 6px #d1cdc4, -3px -3px 6px #ffffff',
        innerShadow: 'inset 3px 3px 6px #d1cdc4, inset -3px -3px 6px #ffffff'
    },
    drums: {
        background: 'from-[#f7f2f2] to-[#ece4e4]',
        containerBg: 'bg-[#f3eaea]',
        buttonBg: 'bg-[#ece4e4]',
        textColor: 'text-[#584949]',
        shadow: '3px 3px 6px #d4cccc, -3px -3px 6px #ffffff',
        innerShadow: 'inset 3px 3px 6px #d4cccc, inset -3px -3px 6px #ffffff'
    }
};

const TunableKeyboard: React.FC = () => {
    // Set up Redux dispatch and selectors
    const dispatch = useAppDispatch();
    const activeNotes = useSelector(selectActiveNotes);
    const isInitialized = useSelector(selectIsInitialized);
    const currentMode = useSelector(selectMode);

    // Initialize audio system on first interaction
    const initializeAudio = useCallback(() => {
        if (!isInitialized) {
            dispatch(initializeAudioContext());
        }
    }, [dispatch, isInitialized]);

    // Handle note triggering with proper audio initialization
    const handleNoteOn = useCallback((note: number) => {
        initializeAudio();
        dispatch(noteOn(note));
    }, [dispatch, initializeAudio]);

    const handleNoteOff = useCallback((note: number) => {
        dispatch(noteOff(note));
    }, [dispatch]);

    // Handle tuning changes for microtonality
    const handleTuningChange = useCallback((note: number, cents: number) => {
        dispatch(setTuning({ note, cents }));
    }, [dispatch]);

    // Handle mode changes - this affects both visuals and sound generation
    const handleModeChange = useCallback((newMode: SynthMode) => {
        dispatch(setMode(newMode));
    }, [dispatch]);

    // Computer keyboard mapping for musical input
    useEffect(() => {
        const keyMap: Record<string, number> = {
            'a': 60,  // Middle C
            'w': 61,
            's': 62,
            'e': 63,
            'd': 64,
            'f': 65,
            't': 66,
            'g': 67,
            'y': 68,
            'h': 69,
            'u': 70,
            'j': 71
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const note = keyMap[e.key.toLowerCase()];
            if (note !== undefined) {
                handleNoteOn(note);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const note = keyMap[e.key.toLowerCase()];
            if (note !== undefined) {
                handleNoteOff(note);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleNoteOn, handleNoteOff]);

    // Generate notes for display (one octave starting at middle C)
    const notes = Array.from({ length: 12 }, (_, i) => ({
        note: 60 + i,
        frequency: 440 * Math.pow(2, (60 + i - 69) / 12)
    }));

    const currentStyle = modeStyles[currentMode];

    return (
        <Card className={`p-8 bg-gradient-to-br transition-all duration-300 ease-in-out ${currentStyle.background}`}>
            <div className="flex flex-col gap-6">
                {/* Mode Toggle Buttons */}
                <div className="flex justify-center gap-4">
                    {(['tunable', 'drums'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`
                                px-6 py-3 rounded-xl
                                transition-all duration-300 ease-in-out
                                ${currentMode === m ? modeStyles[m].buttonBg : 'bg-opacity-50'}
                                ${modeStyles[m].textColor}
                                ${currentMode === m ? 'scale-105' : 'scale-100'}
                            `}
                            style={{
                                boxShadow: currentMode === m ? modeStyles[m].shadow : 'none'
                            }}
                        >
                            {modeLabels[m]}
                        </button>
                    ))}
                </div>

                {/* Grid of Keys */}
                <div
                    className={`
                        grid grid-cols-6 gap-x-6 gap-y-6 p-8 rounded-xl 
                        transition-all duration-300 ease-in-out
                        ${currentStyle.containerBg}
                    `}
                    style={{
                        boxShadow: currentStyle.innerShadow,
                        width: 'fit-content',
                        margin: '0 auto'
                    }}
                >
                    {/* First row: notes 0-5 */}
                    <div className="contents transition-all duration-300 ease-in-out">
                        {notes.slice(0, 6).map(({note}) => (
                            <div key={note} className="flex justify-center transition-all duration-300 ease-in-out">
                                <TunableKey
                                    note={note}
                                    isPressed={activeNotes.includes(note)}
                                    tuning={useSelector(state => selectTuning(state, note))}
                                    onNoteOn={handleNoteOn}
                                    onNoteOff={handleNoteOff}
                                    onTuningChange={handleTuningChange}
                                    mode={currentMode}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Second row: notes 6-11 */}
                    <div className="contents transition-all duration-300 ease-in-out">
                        {notes.slice(6, 12).map(({note}) => (
                            <div key={note} className="flex justify-center transition-all duration-300 ease-in-out">
                                <TunableKey
                                    note={note}
                                    isPressed={activeNotes.includes(note)}
                                    tuning={useSelector(state => selectTuning(state, note))}
                                    onNoteOn={handleNoteOn}
                                    onNoteOff={handleNoteOff}
                                    onTuningChange={handleTuningChange}
                                    mode={currentMode}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TunableKeyboard;