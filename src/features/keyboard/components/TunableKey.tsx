import React, { useCallback, useRef } from 'react';
import { KeyProps } from './keyboard.types.ts';

const TunableKey: React.FC<KeyProps> = ({
                                            note,
                                            isPressed,
                                            tuning,
                                            onNoteOn,
                                            onNoteOff,
                                            onTuningChange
                                        }) => {
    const isTuningRef = useRef(false);

    const handleTuningChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTuning = Number(e.target.value);
        onTuningChange(note, newTuning);
    }, [note, onTuningChange]);

    return (
        <div className="relative flex flex-col items-center">
            {/* Tuning control */}
            <div
                className="mb-2 w-20"
                onMouseDown={() => isTuningRef.current = true}
                onMouseUp={() => isTuningRef.current = false}
            >
                <input
                    type="range"
                    min="-100"
                    max="100"
                    value={tuning}
                    onChange={handleTuningChange}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer
                             focus:outline-none
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-3
                             [&::-webkit-slider-thumb]:h-3
                             [&::-webkit-slider-thumb]:bg-[#e6e3da]
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:shadow-[2px_2px_4px_#d1cdc4,_-2px_-2px_4px_#ffffff]
                             [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-moz-range-thumb]:appearance-none
                             [&::-moz-range-thumb]:w-3
                             [&::-moz-range-thumb]:h-3
                             [&::-moz-range-thumb]:bg-[#e6e3da]
                             [&::-moz-range-thumb]:rounded-full
                             [&::-moz-range-thumb]:shadow-[2px_2px_4px_#d1cdc4,_-2px_-2px_4px_#ffffff]
                             [&::-moz-range-thumb]:cursor-pointer"
                    style={{
                        background: 'linear-gradient(to right, #d4d1c7, #e8e6e1)',
                        WebkitAppearance: 'none'
                    }}
                />
            </div>

            {/* Neumorphic key */}
            <div
                className={`
                    w-20 h-20 rounded-xl select-none cursor-pointer
                    transition-all duration-75 transform
                    ${isPressed
                    ? 'bg-[#e0ddd4] translate-y-[1px]'
                    : 'bg-[#e8e4dc]'
                }
                `}
                onMouseDown={() => !isTuningRef.current && onNoteOn(note)}
                onMouseUp={() => !isTuningRef.current && onNoteOff(note)}
                onMouseLeave={() => !isTuningRef.current && onNoteOff(note)}
                style={{
                    boxShadow: isPressed
                        ? 'inset 2px 2px 5px #d1cdc4, inset -2px -2px 5px #ffffff'
                        : '5px 5px 10px #d1cdc4, -5px -5px 10px #ffffff'
                }}
            />
        </div>
    );
};

export default React.memo(TunableKey);