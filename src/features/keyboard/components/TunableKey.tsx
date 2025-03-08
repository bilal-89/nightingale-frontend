// TunableKey.tsx - Extracted key component
import React, { useRef } from 'react';
import { KeyProps } from './keyboard.types';
import { drumSounds } from '../../audio/constants/drumSounds.ts';
import { getColorWithOpacity, getMutedColor } from '../../../shared/constants/colors';

// Add new props for SVG-specific attributes
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
    // SVG props
    pathData?: string;
    noteName?: string;
}

const TunableKey: React.FC<ExtendedKeyProps> = ({
                                                    note,
                                                    isPressed,
                                                    onNoteOn,
                                                    onNoteOff,
                                                    mode,
                                                    trackColor,
                                                    pathData,
                                                    noteName
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

    // Enhanced neumorphic styles for a more distinct raised/pressed effect
    const modeStyles = {
        tunable: {
            // Default state (raised)
            fill: trackColor
                ? getColorWithOpacity(trackColor, isPressed ? 0.40 : 0.25)
                : (isPressed ? 'url(#keyGradientPressed)' : 'url(#keyGradient)'),
            stroke: isPressed ? '#e0dbd6' : '#f0f0f0',
            strokeOpacity: 0.9, // Maintain same opacity for both states
            strokeWidth: 1.5, // Consistent stroke width for both states
            // Less translation for subtler effect - ensure proper format with parentheses
            transform: isPressed ? 'translate(1.5px, 1.5px)' : '',
            // Transition for smooth state changes
            transition: 'all 120ms cubic-bezier(0.4, 0, 0.2, 1)',
            // Filter reference
            filter: isPressed ? `url(#inner-shadow-${note % 12})` : `url(#outer-shadow-${note % 12})`
        },
        drums: {
            fill: trackColor
                ? getColorWithOpacity(trackColor, isPressed ? 0.40 : 0.25)
                : (isPressed ? 'url(#keyGradientPressed)' : 'url(#keyGradient)'),
            stroke: isPressed ? '#e0dbd6' : '#f0f0f0',
            strokeOpacity: 0.9,
            strokeWidth: 1.5,
            transform: isPressed ? 'translate(1.5px, 1.5px)' : '',
            transition: 'all 120ms cubic-bezier(0.4, 0, 0.2, 1)',
            filter: isPressed ? `url(#inner-shadow-${note % 12})` : `url(#outer-shadow-${note % 12})`
        }
    };

    const styles = modeStyles[mode];

    // Make sure the transform property is properly formatted
    if (styles.transform && styles.transform.length > 0) {
        // Ensure the transform attribute has valid syntax with proper parentheses
        if (styles.transform.includes('translate') && !styles.transform.includes('(')) {
            // If we have a translate without parentheses, format it correctly
            styles.transform = 'translate(0, 0)'; 
        } else if (styles.transform.includes('translate(') && !styles.transform.includes(')')) {
            // If we have an opening parenthesis but no closing one, add it
            styles.transform = styles.transform + ')';
        }
    }

    // If we have path data, render the SVG version
    if (pathData) {
        return (
            <g
                transform={styles.transform}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: 'pointer', transition: styles.transition }}
                className="group"
                data-note={note % 12}
            >
                {/* Main key shape */}
                <path
                    d={pathData}
                    fill={styles.fill}
                    stroke={styles.stroke}
                    strokeOpacity={styles.strokeOpacity}
                    strokeWidth={styles.strokeWidth}
                    filter={styles.filter}
                    className={`transition-all duration-120 ${isPressed ? 'pressed' : ''}`}
                />
            </g>
        );
    }

    // Fallback div-based rendering
    const defaultColor = mode === 'tunable' ? '#f2f0eb' : '#f1e9e9';
    const displayColor = trackColor ? getMutedColor(trackColor) : defaultColor;

    return (
        <div className="relative flex flex-col items-center">
            <div
                className={`
          select-none cursor-pointer
          transition-all duration-120 ease-in-out transform
          ${mode === 'tunable' ? 'w-16 h-24' : 'w-20 h-20'}
          rounded-[14px]
          ${isPressed ? 'translate-y-[2px]' : ''}
          ${mode === 'drums' ? 'flex items-center justify-center' : ''}
          hover:brightness-105
        `}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    background: isPressed
                        ? (trackColor ? getColorWithOpacity(trackColor, mode === 'tunable' ? 0.5 : 0.4) : (mode === 'tunable' ? '#e0dbd6' : '#e1d9d9'))
                        : (trackColor ? getColorWithOpacity(trackColor, mode === 'tunable' ? 0.25 : 0.2) : (mode === 'tunable' ? '#f2f0eb' : '#f1e9e9')),
                    boxShadow: isPressed
                        ? `inset 3px 3px 6px ${mode === 'tunable' ? '#c1c5c9' : '#cac6bd'}, 
               inset -2px -2px 4px #ffffff,
               0px 0px 0px 1px rgba(224, 219, 214, 0.5)`
                        : `4px 4px 8px ${mode === 'tunable' ? '#c8ccd0' : '#d1cdc4'}, 
               -3px -3px 6px #ffffff,
               0px 0px 0px 1px rgba(240, 240, 240, 0.5)`,
                    transition: 'all 120ms cubic-bezier(0.4, 0, 0.2, 1)',
                    border: isPressed
                        ? '1px solid rgba(224, 219, 214, 0.7)'
                        : '1px solid rgba(240, 240, 240, 0.7)'
                }}
            />
        </div>
    );
};

export default TunableKey;