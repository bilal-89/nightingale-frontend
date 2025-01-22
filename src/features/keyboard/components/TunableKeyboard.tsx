import React, { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { Card } from '../../../components/ui/card';
import TunableKey from './TunableKey';
import {
    noteOn,
    noteOff,
    setKeyParameter,
    setMode,
    togglePanel,
    selectActiveNotes,
    selectParameter,
    selectIsInitialized,
    selectMode,
    selectIsPanelVisible,
    SynthMode
} from '../../../store/slices/keyboard/keyboard.slice';
import { initializeAudioContext } from '../../../store/middleware/keyboardAudio.middleware';
import { RootState } from '../../../store';

// Define the available synthesis modes and their display labels
const modeLabels: Record<SynthMode, string> = {
    tunable: "Tones",
    drums: "Drums"
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
    const dispatch = useAppDispatch();
    const activeNotes = useSelector(selectActiveNotes);
    const isInitialized = useSelector(selectIsInitialized);
    const currentMode = useSelector(selectMode);
    const isPanelVisible = useSelector(selectIsPanelVisible);

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
        dispatch(setKeyParameter({
            keyNumber: note,
            parameter: 'tuning',
            value: cents
        }));
    }, [dispatch]);

    const handleModeChange = useCallback((newMode: SynthMode) => {
        dispatch(setMode(newMode));
    }, [dispatch]);

    const handlePanelClick = useCallback(() => {
        dispatch(togglePanel());
    }, [dispatch]);

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

    const notes = Array.from({ length: 12 }, (_, i) => ({
        note: 60 + i,
        frequency: 440 * Math.pow(2, (60 + i - 69) / 12)
    }));

    const currentStyle = modeStyles[currentMode];

    return (
        <Card className={`p-8 bg-gradient-to-br transition-all duration-300 ease-in-out ${currentStyle.background}`}>
            <div className="flex flex-col gap-6">
                <div className="flex justify-center gap-4">
                    {(['tunable', 'drums'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => handleModeChange(mode)}
                            className={`
                                px-6 py-3 rounded-xl
                                transition-all duration-300 ease-in-out
                                ${currentMode === mode ? modeStyles[mode].buttonBg : 'bg-opacity-50'}
                                ${modeStyles[mode].textColor}
                                ${currentMode === mode ? 'scale-105' : 'scale-100'}
                            `}
                            style={{
                                boxShadow: currentMode === mode ? modeStyles[mode].shadow : 'none'
                            }}
                        >
                            {modeLabels[mode]}
                        </button>
                    ))}
                </div>

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
                    <div className="contents transition-all duration-300 ease-in-out">
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