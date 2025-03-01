// KeyboardLayout.tsx - Extracted layout component
import React from 'react';
import { KEY_DATA } from "../data/keyboardData";
import TunableKey from './TunableKey';
import { useSelector } from 'react-redux';
import { selectActiveNotes, selectParameter } from '../store/slices/keyboard.slice';
import { RootState } from '../../../store';

interface KeyboardLayoutProps {
    notes: Array<{
        note: number;
        baseNote: number;
        frequency: number;
    }>;
    currentMode: 'tunable' | 'drums';
    currentTrackColor?: string;
    isPanelVisible: boolean;
    handleNoteOn: (note: number) => void;
    handleNoteOff: (note: number) => void;
    handleTuningChange: (note: number, cents: number) => void;
    handlePanelClick: () => void;
    handleContainerClick: () => void;
    isContainerPressed?: boolean;
}

export const KeyboardLayout: React.FC<KeyboardLayoutProps> = ({
                                                                  notes,
                                                                  currentMode,
                                                                  currentTrackColor,
                                                                  isPanelVisible,
                                                                  handleNoteOn,
                                                                  handleNoteOff,
                                                                  handleTuningChange,
                                                                  handlePanelClick,
                                                                  handleContainerClick,
                                                                  isContainerPressed = false
                                                              }) => {
    const activeNotes = useSelector(selectActiveNotes);

    return (
        <div className="relative w-full h-auto">
            <svg
                viewBox="-10 -5 572 262"
                width="100%"
                height="auto"
                className="relative z-0"
            >
                {/* Background container shape */}
                <KeyboardContainer
                    onClick={handleContainerClick}
                    isPressed={isContainerPressed}
                />

                {/* Define SVG filters and gradients */}
                <KeyboardFiltersAndGradients notes={notes} />

                {/* Add a transform group to position the keys properly within the container */}
                <g transform="translate(30, 25) scale(1.05)">
                    {/* Render each key */}
                    {notes.map(({note, baseNote}) => {
                        const keyData = KEY_DATA[baseNote];
                        if (!keyData) return null;

                        return (
                            <TunableKey
                                key={note}
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
                                pathData={keyData.path}
                                noteName={keyData.noteName}
                            />
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

// Component for the container background
interface KeyboardContainerProps {
    onClick: () => void;
    isPressed?: boolean;
}

export const KeyboardContainer: React.FC<KeyboardContainerProps> = ({ onClick, isPressed = false }) => {
    return (
        <path
            opacity="0.3"
            d="M118.594 6.71135L182 21L261.875 29.5741C267.614 30.1902 273.396 30.3082 279.156 29.9268L346 25.5L416.118 12.9146C421.362 11.9734 426.68 11.5 432.007 11.5H440.348C459.903 11.5 478.585 19.5994 491.952 33.8727C497.607 39.9107 502.158 46.8943 505.398 54.5056L522 93.5L536.05 121.175C537.681 124.387 539.054 127.723 540.156 131.152L544.929 146.001C549.313 159.64 546.185 174.58 536.698 185.315C534.244 188.092 531.422 190.52 528.309 192.531L509.634 204.598C503.562 208.521 497.084 211.774 490.311 214.301L448.707 229.82C441.262 232.597 433.513 234.476 425.623 235.419L358 243.5L267 247L203 243.5L143.5 234L83.9225 219.878C78.6496 218.628 73.4869 216.952 68.4856 214.865L43.691 204.521C36.53 201.534 29.9984 197.22 24.4402 191.806C9.23634 176.997 2.73408 155.399 7.23464 134.658L9.26058 125.321C10.7469 118.471 13.1405 111.85 16.3782 105.633L32.8527 74L51.983 38.9735C53.6094 35.9958 55.4665 33.1499 57.5374 30.4622L59.3698 28.084C69.9132 14.3999 85.9637 6.07299 103.223 5.33332C108.385 5.11208 113.554 5.57545 118.594 6.71135Z"
            fill="url(#keyGradient)"
            stroke="#e8e4dc"
            strokeWidth="2"
            filter={isPressed ? "url(#container-inner-shadow)" : "url(#container-shadow)"}
            className={`cursor-pointer transition-all duration-75 ${isPressed ? 'translate-y-1 opacity-40' : ''}`}
            onClick={onClick}
            data-role="container"
            style={{ pointerEvents: 'all' }}
        />
    );
};

// Component for SVG filters and gradients
interface KeyboardFiltersAndGradientsProps {
    notes: Array<{
        note: number;
        baseNote: number;
        frequency: number;
    }>;
}

export const KeyboardFiltersAndGradients: React.FC<KeyboardFiltersAndGradientsProps> = ({ notes }) => {
    return (
        <defs>
            {/* Key gradients */}
            <linearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F9F7F3" />
                <stop offset="100%" stopColor="#F2F0EB" />
            </linearGradient>
            <linearGradient id="keyGradientPressed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E5E0DB" />
                <stop offset="100%" stopColor="#D8D3CE" />
            </linearGradient>

            {/* Container shadow filters */}
            <filter id="container-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#d1cdc4" floodOpacity="0.4" />
                <feDropShadow dx="-3" dy="-3" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.6" />
            </filter>

            <filter id="container-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feOffset dx="2" dy="2" />
                <feGaussianBlur stdDeviation="3" result="offset-blur" />
                <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                <feFlood floodColor="#c8c4bb" floodOpacity="0.8" result="color" />
                <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>

            {/* Individual filters for each key */}
            {notes.map(({baseNote}) => (
                <React.Fragment key={`filters-${baseNote}`}>
                    {/* Outer shadow for raised state */}
                    <filter id={`outer-shadow-${baseNote % 12}`} x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="4" dy="4" stdDeviation="2.5" floodColor="#d1cdc4" floodOpacity="0.8" />
                        <feDropShadow dx="-3" dy="-3" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.9" />
                    </filter>

                    {/* Inner shadow for pressed state */}
                    <filter id={`inner-shadow-${baseNote % 12}`} x="-30%" y="-30%" width="160%" height="160%">
                        {/* Main shadow effect for pressed state */}
                        <feOffset dx="1.5" dy="1.5" />
                        <feGaussianBlur stdDeviation="1.8" result="offset-blur" />
                        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                        <feFlood floodColor="#c8c4bb" floodOpacity="0.85" result="color" />
                        <feComposite operator="in" in="color" in2="inverse" result="shadow" />

                        {/* Inner highlight effect */}
                        <feOffset dx="-1" dy="-1" />
                        <feGaussianBlur stdDeviation="0.8" result="highlight-blur" />
                        <feComposite operator="out" in="SourceGraphic" in2="highlight-blur" result="inverse2" />
                        <feFlood floodColor="#ffffff" floodOpacity="0.4" result="highlight-color" />
                        <feComposite operator="in" in="highlight-color" in2="inverse2" result="highlight" />

                        {/* Combine inner shadow and highlight */}
                        <feComposite operator="over" in="shadow" in2="highlight" result="combined-shadow" />
                        <feComposite operator="over" in="combined-shadow" in2="SourceGraphic" />

                        {/* Border effect */}
                        <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="thickened"/>
                        <feFlood floodColor="#e0dbd6" floodOpacity="0.7" result="border-color"/>
                        <feComposite in="border-color" in2="thickened" operator="in" result="border"/>
                        <feComposite in="border" in2="SourceGraphic" operator="over"/>
                    </filter>

                    {/* Hover effect filter */}
                    <filter id={`hover-glow-${baseNote % 12}`}>
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feFlood floodColor="#ffffff" floodOpacity="0.3" result="glow-color" />
                        <feComposite operator="in" in="glow-color" in2="blur" result="soft-glow" />
                        <feComposite operator="over" in="soft-glow" in2="SourceGraphic" />
                    </filter>
                </React.Fragment>
            ))}
        </defs>
    );
};