import React, { useCallback, useRef } from 'react';
import { KeyProps } from './keyboard.types';
import { drumSounds } from '../../../audio/context/drums/drumSoundManager';

interface ExtendedKeyProps extends Omit<KeyProps, 'isBirdsong'> {
    mode: 'tunable' | 'drums';  // Removed birdsong mode
}

const TunableKey: React.FC<ExtendedKeyProps> = ({
                                                    note,
                                                    isPressed,
                                                    tuning,
                                                    onNoteOn,
                                                    onNoteOff,
                                                    onTuningChange,
                                                    mode
                                                }) => {
    const isTuningRef = useRef(false);
    const drumSound = mode === 'drums' ? drumSounds[note] : null;

    const handleTuningChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newTuning = Number(e.target.value);
        onTuningChange(note, newTuning);
    }, [note, onTuningChange]);

    // Updated mode-specific styles
    const modeStyles = {
        tunable: {
            // Given birdsong's taller, more rounded look to the flute
            bg: '#e5e9ec',
            bgPressed: '#dde1e4',
            shadow1: '#c8ccd0',
            shadow2: '#ffffff',
            keySize: 'w-16 h-24',  // Taller keys
            borderRadius: 'rounded-3xl', // More rounded
            translation: 'translate-y-[2px]',
            sliderHeight: 'h-2',
            thumbSize: 'w-4 h-4',
            sliderBg: 'linear-gradient(to right, #cfd3d6, #e5e9ec)',
            shadowSize: '4px'
        },
        drums: {
            // Given original flute (tunable) look to drums
            bg: '#ece4e4',  // Keeping the unified drum color
            bgPressed: '#e4dcdc',
            shadow1: '#d1cdc4',
            shadow2: '#ffffff',
            keySize: 'w-20 h-20',  // Square shape from original flute
            borderRadius: 'rounded-2xl',
            translation: 'translate-y-[1px]',
            sliderHeight: 'h-1.5',
            thumbSize: 'w-3 h-3',
            sliderBg: 'linear-gradient(to right, #d4d1c7, #e8e6e1)',
            shadowSize: '5px'
        }
    };

    const currentStyle = modeStyles[mode];

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
                    className={`
                        w-full rounded-lg appearance-none cursor-pointer
                        transition-all duration-500 ease-in-out
                        focus:outline-none
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:transition-all
                        [&::-webkit-slider-thumb]:duration-500
                        [&::-moz-range-thumb]:appearance-none
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:transition-all
                        [&::-moz-range-thumb]:duration-500
                        ${currentStyle.sliderHeight}
                        [&::-webkit-slider-thumb]:${currentStyle.thumbSize}
                        [&::-moz-range-thumb]:${currentStyle.thumbSize}
                    `}
                    style={{
                        background: currentStyle.sliderBg,
                        WebkitAppearance: 'none',
                    }}
                />
            </div>

            {/* Morphing key */}
            <div
                className={`
                    select-none cursor-pointer
                    transition-all duration-500 ease-in-out transform
                    ${currentStyle.keySize}
                    ${currentStyle.borderRadius}
                    ${isPressed ? currentStyle.translation : ''}
                    ${mode === 'drums' ? 'flex items-center justify-center' : ''}
                `}
                onMouseDown={() => !isTuningRef.current && onNoteOn(note)}
                onMouseUp={() => !isTuningRef.current && onNoteOff(note)}
                onMouseLeave={() => !isTuningRef.current && onNoteOff(note)}
                style={{
                    background: isPressed ? currentStyle.bgPressed : currentStyle.bg,
                    boxShadow: isPressed
                        ? `inset ${currentStyle.shadowSize} ${currentStyle.shadowSize} ${parseInt(currentStyle.shadowSize) * 2}px ${currentStyle.shadow1}, 
                           inset -${currentStyle.shadowSize} -${currentStyle.shadowSize} ${parseInt(currentStyle.shadowSize) * 2}px ${currentStyle.shadow2}`
                        : `${currentStyle.shadowSize} ${currentStyle.shadowSize} ${parseInt(currentStyle.shadowSize) * 2}px ${currentStyle.shadow1}, 
                           -${currentStyle.shadowSize} -${currentStyle.shadowSize} ${parseInt(currentStyle.shadowSize) * 2}px ${currentStyle.shadow2}`,
                    transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {mode === 'drums' && drumSound && (
                    <span className={`
                        text-sm font-medium transition-opacity duration-500
                        ${isPressed ? 'opacity-50' : 'opacity-70'}
                    `}>
                        {drumSound.label}
                    </span>
                )}
            </div>
        </div>
    );
};

export default React.memo(TunableKey);