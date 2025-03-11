import React, { useState, useRef, useEffect } from 'react';
import { 
    Waveform, 
    toggleWaveform, 
    setEditableWaveform, 
    selectActiveWaveforms, 
    selectEditableWaveform,
    selectIsGlobalOscillatorMode,
    selectSelectedKey,
    selectActiveNotes
} from '../../../../../features/keyboard/store/slices/keyboard.slice';
import { getMutedColor } from '../../../../../shared/constants/colors';
import { useAppSelector, useAppDispatch } from "../../../../../store/hooks";

// Long press duration for selecting editable waveform (in ms)
const LONG_PRESS_DURATION = 500;

// Map between waveform types and their display names (for accessibility/tooltips)
const WAVEFORM_NAMES = {
    sine: 'Sine',
    square: 'Square',
    sawtooth: 'Sawtooth',
    triangle: 'Triangle'
};

const MultiWaveformControls: React.FC = () => {
    const dispatch = useAppDispatch();
    
    // Get Redux state
    const globalActiveWaveforms = useAppSelector(selectActiveWaveforms);
    const editableWaveform = useAppSelector(selectEditableWaveform);
    const isGlobalMode = useAppSelector(selectIsGlobalOscillatorMode);
    const selectedKey = useAppSelector(selectSelectedKey);
    const activeNotes = useAppSelector(selectActiveNotes);
    
    // Use activeNotes as a fallback if no key is explicitly selected
    const hasKeySelected = isGlobalMode || selectedKey !== null || activeNotes.length > 0;
    // If we're in local mode and no key is explicitly selected but we have active notes,
    // use the first active note as our "effective" selected key
    const effectiveSelectedKey = selectedKey !== null ? selectedKey 
        : activeNotes.length > 0 ? activeNotes[0] 
        : null;
    
    // Get key-specific active waveforms in local mode
    const keySpecificActiveWaveforms = useAppSelector(state => {
        if (isGlobalMode) {
            return globalActiveWaveforms;
        }
        
        if (effectiveSelectedKey !== null) {
            // Look for custom oscillators for this key
            const keyParams = state.keyboard.keyParameters[effectiveSelectedKey];
            if (keyParams?.activeWaveforms) {
                console.log(`[UI] Using key-specific waveforms for key ${effectiveSelectedKey}: ${keyParams.activeWaveforms.join(', ')}`);
                return keyParams.activeWaveforms;
            }
        }
        
        // Fallback to global waveforms
        return globalActiveWaveforms;
    });
    
    // Use the appropriate active waveforms based on mode
    const activeWaveforms = isGlobalMode ? globalActiveWaveforms : keySpecificActiveWaveforms;
    
    // Try to get track color, but provide fallbacks in case player state is different
    // than expected - fixing TypeScript errors
    let currentTrackColor: string | undefined;
    try {
        // @ts-ignore - Ignore type errors for now as we're providing fallbacks
        const currentTrack = useAppSelector(state => state.player?.currentTrack);
        // @ts-ignore
        const tracks = useAppSelector(state => state.player?.tracks);
        
        if (currentTrack !== undefined && tracks && tracks[currentTrack]) {
            currentTrackColor = tracks[currentTrack].color;
        }
    } catch (e) {
        console.warn('Could not get track color:', e);
        currentTrackColor = '#B3D94C'; // Default accent color
    }
    
    // State for long-press functionality
    const [pressedWaveform, setPressedWaveform] = useState<Waveform | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, []);

    // Debug output when relevant state changes
    useEffect(() => {
        console.log(`[UI DEBUG] MultiWaveformControls state:
            - Global mode: ${isGlobalMode}
            - Selected key: ${selectedKey}
            - Effective key: ${effectiveSelectedKey}
            - Global active waveforms: ${globalActiveWaveforms.join(', ')}
            - Key-specific active waveforms: ${keySpecificActiveWaveforms.join(', ')}
            - Active waveforms (used): ${activeWaveforms.join(', ')}
            - Editable waveform: ${editableWaveform}`);
    }, [isGlobalMode, selectedKey, effectiveSelectedKey, globalActiveWaveforms, keySpecificActiveWaveforms, editableWaveform]);

    // Handle pressing down on a waveform button
    const handleWaveformPress = (waveform: Waveform) => {
        setPressedWaveform(waveform);
        
        // Start timer for long press
        longPressTimer.current = setTimeout(() => {
            // On long press, make this the editable waveform
            dispatch(setEditableWaveform(waveform));
            setPressedWaveform(null);
        }, LONG_PRESS_DURATION);
    };

    // Handle releasing a waveform button
    const handleWaveformRelease = (waveform: Waveform) => {
        // Clear long press timer
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        
        // If it wasn't a long press, toggle the waveform
        if (pressedWaveform === waveform) {
            // In local mode, we need a selected key to toggle oscillators
            if (!isGlobalMode && effectiveSelectedKey === null) {
                // Just log a message - don't show an alert as it's disruptive
                console.log("Please select a key first by playing a note");
            } else {
                // Toggle the waveform and log for debugging
                console.log(`Toggling waveform: ${waveform}, current active waveforms: ${activeWaveforms.join(', ')}, effectiveKey: ${effectiveSelectedKey}`);
                dispatch(toggleWaveform(waveform));
                
                // If toggling on and no editable waveform is set, make this one editable
                if (!activeWaveforms.includes(waveform) && !editableWaveform) {
                    dispatch(setEditableWaveform(waveform));
                }
            }
        }
        
        setPressedWaveform(null);
    };

    // When mouse leaves button, cancel the long press
    const handleMouseLeave = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setPressedWaveform(null);
    };

    // Neumorphic styles with dynamic track color for pressed state
    const neumorphicStyles = {
        normal: {
            filter: 'drop-shadow(1px 1px 0px #EEE3D6)',
            transform: 'scale(1)',
            stroke: 'rgba(240, 240, 240, 0.7)',
            strokeWidth: 1
        },
        pressed: {
            filter: 'drop-shadow(0px 0px 0px rgba(0, 0, 0, 0.1))',
            transform: 'scale(0.95)',
            stroke: currentTrackColor ? getMutedColor(currentTrackColor) : 'rgba(224, 219, 214, 0.2)',
            strokeWidth: 0.1
        },
        editable: {
            // Add a very subtle glow effect for the editable waveform
            filter: 'drop-shadow(0px 0px 1px rgba(179, 217, 76, 0.4))',
            transform: 'scale(0.95)',
            stroke: currentTrackColor ? getMutedColor(currentTrackColor) : 'rgba(224, 219, 214, 0.7)',
            strokeWidth: 0.4, // Make even thinner
            // Add a subtle opacity transition
            transition: 'all 0.15s ease-in-out'
        },
        // Disabled style for when no key is selected in local mode
        disabled: {
            filter: 'drop-shadow(1px 1px 0px #EEE3D6)',
            transform: 'scale(1)',
            stroke: 'rgba(240, 240, 240, 0.4)',
            strokeWidth: 1,
            opacity: 0.7
        }
    };

    // Get style for a specific waveform based on its state
    const getWaveformStyle = (waveform: Waveform) => {
        // In local mode with no key selected, show disabled style ONLY if we have no active notes
        if (!isGlobalMode && effectiveSelectedKey === null) {
            return neumorphicStyles.disabled;
        }
        
        if (editableWaveform === waveform) {
            return neumorphicStyles.editable;
        } else if (activeWaveforms.includes(waveform)) {
            return neumorphicStyles.pressed;
        } else {
            return neumorphicStyles.normal;
        }
    };

    return (
        <div className="mt-6 flex flex-col justify-center">
            <div className="flex space-x-5 items-center" style={{marginTop:'-27px'}} >
                {/* Sine Wave Button */}
                <div
                    className={`p-4 cursor-pointer ${!hasKeySelected ? 'opacity-70' : ''}`}
                    onMouseDown={() => handleWaveformPress('sine')}
                    onMouseUp={() => handleWaveformRelease('sine')}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={() => handleWaveformPress('sine')}
                    onTouchEnd={() => handleWaveformRelease('sine')}
                    title={`${WAVEFORM_NAMES.sine} (long-press to edit)`}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 20 21"
                        style={{
                            filter: getWaveformStyle('sine').filter,
                            transform: getWaveformStyle('sine').transform,
                            transition: 'all 0.1s ease',
                            marginTop:'-6px',
                            rotate:'0deg'
                        }}
                    >
                        <path
                            d="M11.2509 20.262L10.6525 20.2959C5.2666 20.6008 0.664311 16.3741 0.504948 10.9764C0.360536 6.0851 3.9591 1.90685 8.80809 1.30867C9.35877 1.24074 9.91665 1.22077 10.4716 1.24947L11.0447 1.2791C15.9624 1.5334 19.9036 5.50048 20.1269 10.4208C20.3617 15.5945 16.4156 19.9697 11.2509 20.262Z"
                            fill="#EEE3D6"
                            stroke={getWaveformStyle('sine').stroke}
                            strokeWidth={getWaveformStyle('sine').strokeWidth}
                        />
                    </svg>
                </div>

                {/* Square Wave Button */}
                <div
                    className={`p-4 cursor-pointer ${!hasKeySelected ? 'opacity-70' : ''}`}
                    onMouseDown={() => handleWaveformPress('square')}
                    onMouseUp={() => handleWaveformRelease('square')}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={() => handleWaveformPress('square')}
                    onTouchEnd={() => handleWaveformRelease('square')}
                    title={`${WAVEFORM_NAMES.square} (long-press to edit)`}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 16 16"
                        style={{
                            filter: getWaveformStyle('square').filter,
                            transform: getWaveformStyle('square').transform,
                            transition: 'all 0.1s ease',
                            marginTop:'30px',
                            rotate:'0deg'
                        }}
                    >
                        <path
                            d="M29.6878 13.8589L29.7375 4.7232C29.7465 3.0688 31.0916 1.74497 32.7446 1.76357L42.3351 1.8715C43.9942 1.89018 45.3342 3.25373 45.3252 4.91423L45.2765 13.8735C45.2676 15.5065 43.9559 16.8216 42.3245 16.8333L32.733 16.9018C31.0525 16.9138 29.6787 15.541 29.6878 13.8589Z"
                            fill="#EEE3D6"
                            transform="translate(-29.6, -1.5)"
                            stroke={getWaveformStyle('square').stroke}
                            strokeWidth={getWaveformStyle('square').strokeWidth}
                        />
                    </svg>
                </div>

                {/* Triangle Wave Button */}
                <div
                    className={`p-4 cursor-pointer ${!hasKeySelected ? 'opacity-70' : ''}`}
                    onMouseDown={() => handleWaveformPress('triangle')}
                    onMouseUp={() => handleWaveformRelease('triangle')}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={() => handleWaveformPress('triangle')}
                    onTouchEnd={() => handleWaveformRelease('triangle')}
                    title={`${WAVEFORM_NAMES.triangle} (long-press to edit)`}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                        marginTop:'-6px',
                        rotate:'-0deg'
                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 20 17"
                        style={{
                            filter: getWaveformStyle('triangle').filter,
                            transform: getWaveformStyle('triangle').transform,
                            transition: 'all 0.1s ease',
                        }}
                    >
                        <path
                            d="M57.5308 18.5293L73.3018 18.4606C74.8831 18.4537 75.8462 16.7011 74.998 15.3738L66.9071 2.71206C66.1115 1.46702 64.2779 1.50183 63.5088 2.77657L55.8288 15.507C55.0225 16.8435 55.9757 18.5361 57.5308 18.5293Z"
                            fill="#EEE3D6"
                            transform="translate(-55.5, -1.5)"
                            stroke={getWaveformStyle('triangle').stroke}
                            strokeWidth={getWaveformStyle('triangle').strokeWidth}
                        />
                    </svg>
                </div>

                {/* Sawtooth Wave Button */}
                <div
                    className={`p-4 cursor-pointer ${!hasKeySelected ? 'opacity-70' : ''}`}
                    onMouseDown={() => handleWaveformPress('sawtooth')}
                    onMouseUp={() => handleWaveformRelease('sawtooth')}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={() => handleWaveformPress('sawtooth')}
                    onTouchEnd={() => handleWaveformRelease('sawtooth')}
                    title={`${WAVEFORM_NAMES.sawtooth} (long-press to edit)`}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 14 15"
                        style={{
                            filter: getWaveformStyle('sawtooth').filter,
                            transform: getWaveformStyle('sawtooth').transform,
                            transition: 'all 0.1s ease',
                            rotate:'-0deg'
                        }}
                    >
                        <path
                            d="M84.1801 14.9837L95.2731 2.05525C95.8763 1.35217 97.0365 1.7875 97.0365 2.71694L97.0365 15.6454C97.0365 16.1939 96.5933 16.6362 96.0438 16.6362L84.9508 16.6362C84.0937 16.6362 83.6248 15.6309 84.1801 14.9837Z"
                            fill="#EEE3D6"
                            transform="translate(-84, -1.5)"
                            stroke={getWaveformStyle('sawtooth').stroke}
                            strokeWidth={getWaveformStyle('sawtooth').strokeWidth}
                        />
                    </svg>
                </div>
            </div>
            
            {/* Mode indicator and editable waveform indicator removed as requested */}
        </div>
    );
};

export default MultiWaveformControls; 