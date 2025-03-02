// KeyboardLayout.tsx - Updated for switchable layouts
import React from 'react';
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
    // New props for switchable layouts
    containerLayout: {
        containerPath: string;
        keysTransform: string;
        svgViewBox: string;
    };
    keyData: Record<number, {
        path: string;
        noteName: string;
    }>;
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
                                                                  isContainerPressed = false,
                                                                  containerLayout, // Added missing prop
                                                                  keyData // Added missing prop
                                                              }) => {
    const activeNotes = useSelector(selectActiveNotes);

    return (
        <div className="relative w-full h-auto max-h-[400px]">
            <svg
                viewBox={containerLayout.svgViewBox}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                className="relative z-0"
            >
                {/* Background container shape with consistent color */}
                <path
                    opacity="0.2"
                    d={containerLayout.containerPath}
                    fill="url(#keyGradient)"
                    stroke="#B5D16B"
                    strokeWidth="9"
                    filter={isContainerPressed ? "url(#container-inner-shadow)" : "url(#container-shadow)"}
                    className={`cursor-pointer transition-all duration-75 ${isContainerPressed ? 'translate-y-1 opacity-40' : ''}`}
                    onClick={handleContainerClick}
                    data-role="container"
                    style={{ pointerEvents: 'all' }}
                />

                {/* Define SVG filters and gradients */}
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

                                {/* Inner highlight effect - more subtle than before */}
                                <feOffset dx="-1" dy="-1" />
                                <feGaussianBlur stdDeviation="0.8" result="highlight-blur" />
                                <feComposite operator="out" in="SourceGraphic" in2="highlight-blur" result="inverse2" />
                                <feFlood floodColor="#ffffff" floodOpacity="0.4" result="highlight-color" />
                                <feComposite operator="in" in="highlight-color" in2="inverse2" result="highlight" />

                                {/* Combine inner shadow and highlight */}
                                <feComposite operator="over" in="shadow" in2="highlight" result="combined-shadow" />
                                <feComposite operator="over" in="combined-shadow" in2="SourceGraphic" />

                                {/* Add subtle border effect that remains visible when pressed */}
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

                {/* Add a transform group to position the keys properly within the container */}
                <g transform={containerLayout.keysTransform}>
                    {/* Render each key with the organic shapes from Figma */}
                    {notes.map(({note, baseNote}) => {
                        const currentKeyData = keyData[baseNote];
                        if (!currentKeyData) return null;

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
                                pathData={currentKeyData.path}
                                noteName={currentKeyData.noteName}
                            />
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

export default KeyboardLayout;