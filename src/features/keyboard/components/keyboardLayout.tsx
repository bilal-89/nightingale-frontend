// KeyboardLayout.tsx - Updated for switchable layouts with fixed click effect
import React, { useState, useCallback, useEffect } from 'react';
import TunableKey from './TunableKey';
import { useSelector } from 'react-redux';
import { selectActiveNotes, selectParameter, selectCurrentOctave } from '../store/slices/keyboard.slice';
import { RootState } from '../../../store/store';
import { KeyProps } from './Key';

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
        containerStyle?: {
            fill: string;
            filter: string;
            stroke: string | null;
        };
        gradientDefs?: string;
    };
    keyData: Record<number, {
        path: string;
        noteName: string;
    }>;
}

// Helper function to map MIDI note numbers to keyboard positions
const mapNoteToKeyPosition = (note: number, octave: number): number => {
    // Calculate the base note (C in the current octave)
    const baseNote = (octave + 1) * 12;
    
    // Map the note to the correct key position
    const noteInOctave = note % 12;
    const octaveOffset = Math.floor(note / 12) - (octave + 1);
    
    // Create a consistent mapping from note to key position
    const keyPositionMap: Record<number, number> = {
        0: 0,  // C
        1: 1,  // C#
        2: 2,  // D
        3: 3,  // D#
        4: 4,  // E
        5: 5,  // F
        6: 6,  // F#
        7: 7,  // G
        8: 8,  // G#
        9: 9,  // A
        10: 10, // A#
        11: 11  // B
    };
    
    // Return the mapped position plus any octave offset
    return keyPositionMap[noteInOctave] + (octaveOffset * 12);
};

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
                                                                  containerLayout,
                                                                  keyData
                                                              }) => {
    const activeNotes = useSelector(selectActiveNotes);
    const currentOctave = useSelector(selectCurrentOctave);

    // Add local state to track click state for more responsive feedback
    const [isLocalPressed, setIsLocalPressed] = useState(false);

    // Combined pressed state (from props or local)
    const isPressed = isContainerPressed || isLocalPressed;

    // Create a mapping of note numbers to pressed state
    const notePressedMap = React.useMemo(() => {
        const map: Record<number, boolean> = {};
        activeNotes.forEach(note => {
            // Map each active note to its correct key position
            const keyPosition = mapNoteToKeyPosition(note, currentOctave);
            map[keyPosition] = true;
        });
        return map;
    }, [activeNotes, currentOctave]);

    // Event handlers for local click feedback
    const handleMouseDown = useCallback((e) => {
        setIsLocalPressed(true);
        // Prevent event from bubbling up to parent elements
        e.stopPropagation();
    }, []);

    const handleMouseUp = useCallback((e) => {
        setIsLocalPressed(false);
        // Call the provided click handler
        handleContainerClick();
        // Prevent event from bubbling up to parent elements
        e.stopPropagation();
    }, [handleContainerClick]);

    const handleMouseLeave = useCallback(() => {
        setIsLocalPressed(false);
    }, []);

    return (
        <div className="relative w-full h-auto max-h-[400px] overflow-visible">
            <svg
                viewBox={containerLayout.svgViewBox}
                width="100%"
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                className="relative z-0"
            >
                {/* Add custom gradient definitions if provided */}
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

                    {/* Add custom gradient definitions if provided */}
                    {containerLayout.gradientDefs && (
                        <g dangerouslySetInnerHTML={{ __html: containerLayout.gradientDefs }} />
                    )}

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

                {/* Background container shape with custom styling */}
                <path
                    d={containerLayout.containerPath}
                    className="cursor-pointer transition-all duration-75"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    data-role="container"
                    style={{
                        pointerEvents: 'all',
                        transform: isPressed ? 'translateY(2px)' : 'translateY(0px)',
                        ...(containerLayout.containerStyle || {
                            opacity: isPressed ? "0.30" : "0.20",
                            fill: "url(#keyGradient)",
                            stroke: "#B5D16B",
                            strokeWidth: isPressed ? "6" : "9",
                            filter: isPressed ? "url(#container-inner-shadow)" : "url(#container-shadow)"
                        })
                    }}
                />

                {/* Add a transform group to position the keys properly within the container */}
                <g transform={containerLayout.keysTransform}>
                    {/* Render each key with the organic shapes from Figma */}
                    {notes.map(({note, baseNote}) => {
                        const currentKeyData = keyData[baseNote];
                        if (!currentKeyData) return null;

                        // Calculate the actual note number for this key
                        const noteNumber = (currentOctave + 1) * 12 + baseNote % 12;
                        
                        // Check if this key should be shown as pressed
                        const isKeyPressed = notePressedMap[mapNoteToKeyPosition(noteNumber, currentOctave)] || false;

                        return (
                            <TunableKey
                                key={note}
                                note={noteNumber}
                                isPressed={isKeyPressed}
                                tuning={useSelector((state: RootState) =>
                                    selectParameter(state, noteNumber, 'tuning'))}
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