import React, { useRef } from 'react';
import { KeyProps } from './keyboard.types';
import { drumSounds } from '../../audio/constants/drumSounds.ts';
import { getColorWithOpacity } from '../../../shared/constants/colors';

interface ExtendedKeyProps extends Omit<KeyProps, 'isBirdsong'> {
    mode: 'tunable' | 'drums';
    note: number;
    isPressed: boolean;
    tuning: number;
    onNoteOn: (note: number) => void;
    onNoteOff: (note: number) => void;
    onTuningChange: (note: number, tuning: number) => void;
    onPanelClick: () => void;
    isPanelVisible: boolean;
    trackColor?: string;
}

const TunableKey: React.FC<ExtendedKeyProps> = ({
                                                    note,
                                                    isPressed,
                                                    onNoteOn,
                                                    onNoteOff,
                                                    mode,
                                                    trackColor
                                                }) => {
    const isTuningRef = useRef(false);
    const drumSound = mode === 'drums' ? drumSounds[note] : null;

    const handleMouseDown = () => {
        if (isTuningRef.current) return;
        onNoteOn(note);
    };

    const handleMouseUp = () => {
        if (!isTuningRef.current) {
            onNoteOff(note);
        }
    };

    // Define visual styles with more subtle unpressed colors
    const modeStyles = {
        tunable: {
            bg: trackColor ? getColorWithOpacity(trackColor, 0.25) : '#e5e9ec',  // Very subtle when not pressed
            bgPressed: trackColor ? getColorWithOpacity(trackColor, 0.4) : '#dde1e4',  // More intense when pressed
            shadow1: '#c8ccd0',
            shadow2: '#ffffff',
            keySize: 'w-16 h-24',
            borderRadius: 'rounded-[14px]',
            translation: 'translate-y-[7px]',
            shadowSize: '3px'
        },
        drums: {
            bg: trackColor ? getColorWithOpacity(trackColor, 0.2) : '#ece4e4',  // Very subtle when not pressed
            bgPressed: trackColor ? getColorWithOpacity(trackColor, 0.3) : '#e4dcdc',  // More intense when pressed
            shadow1: '#d1cdc4',
            shadow2: '#ffffff',
            keySize: 'w-20 h-20',
            borderRadius: 'rounded-[9px]',
            translation: 'translate-y-[5px]',
            shadowSize: '4px'
        }
    };

    const currentStyle = modeStyles[mode];

    return (
        <div className="relative flex flex-col items-center">
            <div
                className={`
                    select-none cursor-pointer
                    transition-all duration-300 ease-in-out transform
                    ${currentStyle.keySize}
                    ${currentStyle.borderRadius}
                    ${isPressed ? currentStyle.translation : ''}
                    ${mode === 'drums' ? 'flex items-center justify-center' : ''}
                    hover:brightness-110
                `}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    background: isPressed ? currentStyle.bgPressed : currentStyle.bg,
                    boxShadow: isPressed
                        ? `inset ${currentStyle.shadowSize} ${currentStyle.shadowSize} ${parseInt(currentStyle.shadowSize) * 2}px ${currentStyle.shadow1}, 
                           inset -${currentStyle.shadowSize} -${currentStyle.shadowSize} ${parseInt(currentStyle.shadowSize) * 2}px ${currentStyle.shadow2}`
                        : `${currentStyle.shadowSize} ${currentStyle.shadowSize} ${parseInt(currentStyle.shadowSize) * 2}px ${currentStyle.shadow1}, 
                           -${currentStyle.shadowSize} -${currentStyle.shadowSize} ${parseInt(currentStyle.shadowSize) * 2}px ${currentStyle.shadow2}`,
                    transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                {mode === 'drums' && drumSound && (
                    <span className={`
                        text-sm font-medium transition-opacity duration-300
                        ${isPressed ? 'opacity-10' : 'opacity-30'}
                    `}>
                        {drumSound.label}
                    </span>
                )}
            </div>
        </div>
    );
};

export default React.memo(TunableKey);