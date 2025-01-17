import React, { useCallback, useRef } from 'react';
import { KeyProps } from './keyboard.types';
import { drumSounds } from '../../../audio/context/drums/drumSoundManager';

interface ExtendedKeyProps extends Omit<KeyProps, 'isBirdsong'> {
    mode: 'tunable' | 'birdsong' | 'drums';
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

    const modeStyles = {
        tunable: {
            bg: '#e8e4dc',
            bgPressed: '#e0ddd4',
            shadow1: '#d1cdc4',
            shadow2: '#ffffff',
            keySize: 'w-20 h-20',
            borderRadius: 'rounded-3xl', // Increased roundness to make transition smoother
            translation: 'translate-y-[1px]',
            sliderHeight: 'h-1.5',
            thumbSize: 'w-3 h-3',
            sliderBg: 'linear-gradient(to right, #d4d1c7, #e8e6e1)',
            shadowSize: '5px'
        },
        birdsong: {
            bg: '#e5e9ec',
            bgPressed: '#dde1e4',
            shadow1: '#c8ccd0',
            shadow2: '#ffffff',
            keySize: 'w-16 h-24',
            borderRadius: 'rounded-3xl',
            translation: 'translate-y-[2px]',
            sliderHeight: 'h-2',
            thumbSize: 'w-4 h-4',
            sliderBg: 'linear-gradient(to right, #cfd3d6, #e5e9ec)',
            shadowSize: '4px'
        },
        drums: {
            bg: '#ece4e4',
            bgPressed: '#e4dcdc',
            shadow1: '#d4cccc',
            shadow2: '#ffffff',
            keySize: 'w-[5.25rem] h-[5.25rem]',
            borderRadius: 'rounded-[2rem]', // More gradual rounding
            translation: 'translate-y-[3px]',
            sliderHeight: 'h-2',
            thumbSize: 'w-4 h-4',
            sliderBg: 'linear-gradient(to right, #e0d8d8, #ece4e4)',
            shadowSize: '6px'
        }
    };

    const currentStyle = modeStyles[mode];

    function adjustColor(color: string, amount: number): string {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    const sliderContainerClass = `
        relative mb-2 w-20
        transition-all duration-500 ease-in-out
        opacity-100
    `;

    return (
        <div className="relative flex flex-col items-center">
            {/* Tuning control with consistent presence */}
            <div className={sliderContainerClass}>
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
                    onMouseDown={() => isTuningRef.current = true}
                    onMouseUp={() => isTuningRef.current = false}
                />
            </div>

            {/* Morphing key with smoother transitions */}
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