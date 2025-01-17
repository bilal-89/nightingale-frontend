import React, { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { Card } from '../../../components/ui/card';
import TunableKey from './TunableKey';
import {
    noteOn,
    noteOff,
    setTuning,
    selectActiveNotes,
    selectTuning,
    selectIsInitialized,
    KeyboardState,
} from '../../../store/slices/keyboard/keyboard.slice';
import { initializeAudioContext } from '../../../store/middleware/keyboardAudio.middleware';

const TunableKeyboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const activeNotes = useSelector(selectActiveNotes);
    const isInitialized = useSelector(selectIsInitialized);

    // Initialize audio on first interaction
    const initializeAudio = useCallback(() => {
        if (!isInitialized) {
            dispatch(initializeAudioContext());
        }
    }, [dispatch, isInitialized]);

    // Handle note triggering
    const handleNoteOn = useCallback((note: number) => {
        initializeAudio();
        dispatch(noteOn(note));
    }, [dispatch, initializeAudio]);

    const handleNoteOff = useCallback((note: number) => {
        dispatch(noteOff(note));
    }, [dispatch]);

    // Handle tuning changes
    const handleTuningChange = useCallback((note: number, cents: number) => {
        dispatch(setTuning({ note, cents }));
    }, [dispatch]);

    // Computer keyboard mapping
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

    // Generate notes for display
    const notes = Array.from({ length: 12 }, (_, i) => ({
        note: 60 + i,  // Starting from middle C
        frequency: 440 * Math.pow(2, (60 + i - 69) / 12)
    }));

    return (
        <Card className="p-8 bg-gradient-to-br from-[#f5f2ed] to-[#e8e4df]">
            <div className="flex flex-col gap-6">
                <div
                    className="grid grid-cols-6 gap-x-6 gap-y-6 p-8 rounded-xl bg-[#f0ece6]"
                    style={{
                        boxShadow: 'inset 3px 3px 6px #d1cdc4, inset -3px -3px 6px #ffffff',
                        width: 'fit-content',
                        margin: '0 auto'
                    }}
                >
                    {/* First row: notes 0-5 */}
                    {notes.slice(0, 6).map(({note}) => (
                        <div key={note} className="flex justify-center">
                            <TunableKey
                                note={note}
                                isPressed={activeNotes.includes(note)}
                                tuning={useSelector(state => selectTuning(state, note))}
                                onNoteOn={handleNoteOn}
                                onNoteOff={handleNoteOff}
                                onTuningChange={handleTuningChange}
                            />
                        </div>
                    ))}

                    {/* Second row: notes 6-11 */}
                    {notes.slice(6, 12).map(({note}) => (
                        <div key={note} className="flex justify-center">
                            <TunableKey
                                note={note}
                                isPressed={activeNotes.includes(note)}
                                tuning={useSelector(state => selectTuning(state, note))}
                                onNoteOn={handleNoteOn}
                                onNoteOff={handleNoteOff}
                                onTuningChange={handleTuningChange}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default TunableKeyboard;