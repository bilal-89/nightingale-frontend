// src/features/parameters/components/ParameterPanel.tsx
import React, { useState, useCallback } from 'react';
import {
    selectIsPanelVisible,
    togglePanel,
    selectParameterContext,
    setGlobalWaveform,
    selectGlobalWaveform,
    selectSelectedKey,
    setKeyWaveform,
} from '../../../../../features/keyboard/store/slices/keyboard.slice';
import { useParameterValues } from '../hooks/useParameterValues.ts';
import { parameters } from '../constants/parameters.ts';
import { ParameterContext } from '../types/types';
import { NoteColor } from '../../../../../shared/constants/colors.ts';
import { ColorStrip } from '../../../../../shared/components/ui/ColorStrip';
import { setTrackSettings } from '../../../../../features/player/store/player';
import { getMutedColor } from '../../../../../shared/constants/colors';
import { useAppDispatch, useAppSelector } from "../../../../../features/player/hooks";
import { selectSelectedNote } from '../../../../../features/player/store/player';
import { useParameters } from '../../../../../features/player/hooks/useParameters';
import { toggleKeyboardLayout } from '../../../../../features/keyboard/store/slices/keyboard.slice';
import { Keyboard } from "lucide-react";

// Simple Keyboard Layout Toggle Component
const KeyboardLayoutToggle = () => {
    const dispatch = useAppDispatch();
    const usingFigmaLayout = useAppSelector(state => state.keyboard.usingFigmaLayout);

    return (
        <div className="flex items-center">
            <button
                onClick={() => dispatch(toggleKeyboardLayout())}
                className="p-2 rounded-lg bg-[#e8e4dc] hover:bg-[#f0ece6] transition-all"
                style={{boxShadow: '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'}}
                title={`Switch to ${usingFigmaLayout ? 'Single' : 'Split'} Layout`}
            >
                <Keyboard className="w-4 h-4 text-[#4a4543]" />
            </button>
            <span className="ml-2 text-xs text-[#6c6661]">
                {usingFigmaLayout ? 'A' : 'B'}
            </span>
        </div>
    );
};

// Color Picker Component (moved from Player)
const ColorPicker = () => {
    const dispatch = useAppDispatch();
    const currentTrack = useAppSelector(state => state.player.currentTrack);
    const tracks = useAppSelector(state => state.player.tracks);
    const currentTrackData = tracks[currentTrack];

    const handleColorSelect = (color: NoteColor) => {
        if (currentTrackData) {
            dispatch(setTrackSettings({
                trackId: currentTrackData.id,
                updates: { color }
            }));
        }
    };

    if (!currentTrackData) return null;

    const displayColor = getMutedColor(currentTrackData.color);

    return (
        <div className="mt-4">
            {/*<div className="text-xs font-medium text-gray-500 mb-2">Track Color</div>*/}
            <ColorStrip
                selectedColor={displayColor}
                onColorSelect={handleColorSelect}
            />
        </div>
    );
};

// SVG Slider with labels and values removed
const SVGSlider: React.FC<{
    parameterId?: string;  // Add parameterId prop to identify which parameter this is
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    precision?: number;
    isMixed?: boolean;
    onChange: (value: number) => void;
    trackColor?: string;
    className?: string;
}> = ({
          parameterId,
          value,
          min,
          max,
          step,
          unit = '',
          precision = 0,
          isMixed = false,
          onChange,
          trackColor = "#B5D16B",
          className = ''
      }) => {
    // Calculate the percentage filled based on current value
    const percentage = ((value - min) / (max - min)) * 100;

    // Track if we're currently dragging to bypass animation
    const [isDragging, setIsDragging] = React.useState(false);

    // Animation state for transitions
    const [animatedPercentage, setAnimatedPercentage] = React.useState(percentage);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const animationRef = React.useRef<number | null>(null);

    // For smooth transitions when value changes (but not during dragging)
    React.useEffect(() => {
        if (!isMixed && !isDragging) {
            setAnimatedPercentage(percentage);
        } else if (isDragging) {
            // When dragging, update immediately without animation
            setAnimatedPercentage(percentage);
        }
    }, [percentage, isMixed, isDragging]);

    // Calculate the width of the slider based on animated percentage
    const sliderWidth = Math.max(6, isDragging ? percentage : animatedPercentage);

    // Animation for mixed values
    React.useEffect(() => {
        if (isMixed && !isDragging) {
            setIsAnimating(true);
            let startTime: number;

            const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;

                // Oscillate between 20% and 80% over 1.5 seconds
                const progress = (elapsed % 1500) / 1500;
                const newWidth = 20 + 60 * Math.sin(progress * Math.PI * 2);

                setAnimatedPercentage(newWidth);
                animationRef.current = requestAnimationFrame(animate);
            };

            animationRef.current = requestAnimationFrame(animate);
        } else {
            setIsAnimating(false);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
        };
    }, [isMixed, isDragging]);

    // Hidden range input ref for native-like dragging
    const rangeInputRef = React.useRef<HTMLInputElement>(null);
    const sliderRef = React.useRef<HTMLDivElement>(null);

    // Handle change from the hidden range input
    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(parseFloat(e.target.value));
    };

    // Handle mouse down on the visible slider
    const handleSliderMouseDown = (e: React.MouseEvent) => {
        if (rangeInputRef.current && sliderRef.current) {
            // Set dragging state to true for immediate updates
            setIsDragging(true);

            // Calculate the value based on click position
            const rect = sliderRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            const newValue = min + (percentage / 100) * (max - min);
            const steppedValue = Math.round(newValue / step) * step;
            const boundedValue = Math.max(min, Math.min(max, steppedValue));

            // Set the range input value and trigger change
            rangeInputRef.current.value = boundedValue.toString();
            onChange(boundedValue);

            // Focus and click the range input to start dragging
            rangeInputRef.current.focus();

            // Simulate a click at the exact position to ensure the slider follows the cursor
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, "value"
            )?.set;

            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(rangeInputRef.current, boundedValue);
                const event = new Event('input', { bubbles: true });
                rangeInputRef.current.dispatchEvent(event);
            }

            // Trigger the native input event
            rangeInputRef.current.dispatchEvent(new MouseEvent('mousedown', {
                clientX: e.clientX,
                clientY: e.clientY,
                bubbles: true
            }));

            // Add document-level event listeners for drag end
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('mouseleave', handleDragEnd);
        }
    };

    // Handle the end of dragging
    const handleDragEnd = React.useCallback(() => {
        setIsDragging(false);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('mouseleave', handleDragEnd);
    }, []);

    // Clean up event listeners on unmount
    React.useEffect(() => {
        return () => {
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('mouseleave', handleDragEnd);
        };
    }, [handleDragEnd]);

    // Check if this is specifically a tuning parameter - use the parameterId
    const isTuningSlider = parameterId === 'tuning';

    return (
        <div className={`mb-8 ${className}`}>
            {/* Slider container with hidden range input */}
            <div
                ref={sliderRef}
                className="relative h-3 cursor-pointer"
                onMouseDown={handleSliderMouseDown}
                style={{ touchAction: 'none' }}
            >
                {/* Hidden native range input for fluid dragging */}
                <input
                    ref={rangeInputRef}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleRangeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    style={{ cursor: 'pointer' }}
                />

                {/* SVG Slider - now with special tuning slider */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        width: `${sliderWidth}%`,
                        transition: isDragging ? 'none' : 'width 150ms ease-out'
                    }}
                >
                    {isTuningSlider ? (
                        // Special curved SVG for tuning parameter with proper hit area
                        <div className="relative" style={{ height: "40px", marginTop: "-6px", marginBottom: "10px" }}>
                            {/* Remove the full-width clickable div */}
                            
                            {/* Background track (invisible) */}
                            <svg
                                width="100%"
                                height="26"
                                viewBox="0 0 106 26"
                                preserveAspectRatio="xMinYMin meet"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="absolute top-0 left-0 opacity-0"
                                style={{ transform: "translateY(8px)" }}
                            >
                                <path
                                    d="M26.75 16H5C2.23858 16 0 18.2386 0 21C0 23.7614 2.23858 26 5 26H26.75L40.125 25L53.5 23.5L66.875 20.5L80.125 17.5L93.5 13.5L102.842 9.21839C104.461 8.47598 105.5 6.8576 105.5 5.07577C105.5 1.89404 102.322 -0.308275 99.3429 0.808907L93.5 3L80.125 7L66.875 10.5L53.5 13.5L40.125 15L26.75 16Z"
                                />
                            </svg>
                            
                            {/* Hidden input precisely aligned with the visible part */}
                            <input
                                ref={rangeInputRef}
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={value}
                                onChange={handleRangeChange}
                                className="absolute opacity-0 cursor-pointer z-20"
                                style={{ 
                                    top: "8px",
                                    left: "0",
                                    width: "100%",
                                    height: "26px",
                                    cursor: 'pointer'
                                }}
                            />
                            
                            {/* The visible slider that clips to the proper percentage */}
                            <div 
                                className="absolute top-0 left-0 h-full overflow-hidden pointer-events-none" 
                                style={{ 
                                    width: `${sliderWidth}%`,
                                    transition: isDragging ? 'none' : 'width 150ms ease-out',
                                    transform: "translateY(8px)"
                                }}
                            >
                                <svg
                                    width="100%"
                                    height="26"
                                    viewBox="0 0 106 26"
                                    preserveAspectRatio="xMinYMin meet"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{ minWidth: "106px" }}
                                    className="pointer-events-none"
                                >
                                    <path
                                        d="M26.75 16H5C2.23858 16 0 18.2386 0 21C0 23.7614 2.23858 26 5 26H26.75L40.125 25L53.5 23.5L66.875 20.5L80.125 17.5L93.5 13.5L102.842 9.21839C104.461 8.47598 105.5 6.8576 105.5 5.07577C105.5 1.89404 102.322 -0.308275 99.3429 0.808907L93.5 3L80.125 7L66.875 10.5L53.5 13.5L40.125 15L26.75 16Z"
                                        fill={trackColor}
                                        fillOpacity="0.45"
                                        className="pointer-events-none"
                                    />
                                </svg>
                            </div>
                            
                            {/* Clickable SVG path that exactly matches the curved slider */}
                            <svg
                                width="100%"
                                height="26"
                                viewBox="0 0 106 26"
                                preserveAspectRatio="xMinYMin meet"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: "translateY(8px)" }}
                                className="absolute top-0 left-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <path
                                    d="M26.75 16H5C2.23858 16 0 18.2386 0 21C0 23.7614 2.23858 26 5 26H26.75L40.125 25L53.5 23.5L66.875 20.5L80.125 17.5L93.5 13.5L102.842 9.21839C104.461 8.47598 105.5 6.8576 105.5 5.07577C105.5 1.89404 102.322 -0.308275 99.3429 0.808907L93.5 3L80.125 7L66.875 10.5L53.5 13.5L40.125 15L26.75 16Z"
                                    fill="transparent"
                                    stroke="transparent"
                                    strokeWidth="0"
                                    className="cursor-pointer"
                                    onMouseDown={handleSliderMouseDown}
                                />
                            </svg>
                        </div>
                    ) : (
                        // Standard slider for other parameters
                        <svg
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07)} 6`}
                            preserveAspectRatio="none"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ transition: isDragging ? 'none' : 'all 150ms ease-out' }}
                        >
                            <path
                                d={`M${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07) - 3} 0H3C1.34315 0 0 1.34315 0 3C0 4.65685 1.34315 6 3 6H${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07) - 3}C${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07) - 3 + 1.65685} 6 ${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07)} 4.65685 ${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07)} 3C${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07)} 1.34315 ${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07) - 3 + 1.65685} 0 ${Math.max(6, (isDragging ? percentage : animatedPercentage) * 1.07) - 3} 0Z`}
                                fill={trackColor}
                                fillOpacity="0.45"
                                style={{ transition: isDragging ? 'none' : 'all 150ms ease-out' }}
                            />
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
};

// Updated Unison Group component with SVG sliders - labels removed
const SVGUnisonGroup: React.FC<{
    context: ParameterContext;
    values: Record<string, { value: number; isMixed: boolean }>;
    onParameterChange: (id: string, value: number) => void;
    currentTrackColor?: string;
    onMouseDown: (e: React.MouseEvent) => void;
    className?: string;
}> = ({ context, values, onParameterChange, currentTrackColor, onMouseDown, className = '' }) => {
    const unisonParams = parameters.filter(p => p.contexts.includes(context) && p.group === 'unison');

    if (unisonParams.length === 0) return null;

    return (
        <div
            className={`pt-2 mt-[-9px] border-t border-gray-200 ${className}`}
            onMouseDown={onMouseDown}
        >
            {unisonParams.map(param => (
                <SVGSlider
                    key={param.id}
                    parameterId={param.id}
                    value={values[param.id]?.value ?? param.defaultValue}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    unit={param.unit || ''}
                    precision={param.precision || 0}
                    isMixed={values[param.id]?.isMixed}
                    onChange={(value) => onParameterChange(param.id, value)}
                    trackColor={currentTrackColor}
                />
            ))}
        </div>
    );
};

const ParameterPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const isPanelVisible = useAppSelector(selectIsPanelVisible);
    const currentTrack = useAppSelector(state => state.player.currentTrack);
    const tracks = useAppSelector(state => state.player.tracks);
    const currentTrackColor = tracks[currentTrack]?.color;
    const reduxParameterContext = useAppSelector(selectParameterContext);
    const globalWaveform = useAppSelector(selectGlobalWaveform);
    const selectedKey = useAppSelector(selectSelectedKey);
    const selectedNote = useAppSelector(selectSelectedNote);
    const { handleParameterChange } = useParameters();

    const [isPressed, setIsPressed] = useState(false);
    const [context, setContext] = useState<ParameterContext>('keyboard');
    const { parameterValues, handleParameterUpdate } = useParameterValues(context);

    // Track whether the click happened on a control element
    const [clickedOnControl, setClickedOnControl] = useState(false);

    // Define the SVG path for the container shape - updated to match new design
    const containerPath = "M0 39.8046V31C0 13.8792 13.8792 0 31 0H58.6091H174.829H202.713C219.834 0 233.713 13.8792 233.713 31V39.8046V108.59V222.729V336.868V405.654L234.074 418.101C234.581 435.567 220.56 450 203.087 450H176.591H65.3636H31C13.8792 450 0 436.121 0 419V405.654V336.868V222.729V108.59V39.8046Z";

    // Get the redux state for keyboard
    const keyboardState = useAppSelector(state => state.keyboard);

    // Handle waveform changes based on context
    const handleWaveformChange = useCallback((waveform) => {
        if (context === 'keyboard') {
            if (selectedKey !== null) {
                // Set waveform for specific key when a key is selected
                dispatch(setKeyWaveform({ keyNumber: selectedKey, waveform }));
            } else {
                // Set global waveform when no specific key is selected
                dispatch(setGlobalWaveform(waveform));
            }
        } else if (context === 'note' && selectedNote) {
            // For note context, update the selected note's waveform
            handleParameterChange(
                selectedNote.trackId,
                selectedNote.note.id,
                'waveform',
                waveform
            );
        }
    }, [context, dispatch, selectedKey, selectedNote, handleParameterChange]);

    // Get current waveform based on context
    const getCurrentWaveform = useCallback(() => {
        if (context === 'keyboard') {
            if (selectedKey !== null) {
                // Get the selected key's waveform from the keyboard state directly
                const keyWaveform = keyboardState.keyParameters[selectedKey]?.waveform;
                return keyWaveform || globalWaveform;
            } else {
                // Return global waveform if no key is selected
                return globalWaveform;
            }
        } else if (context === 'note' && selectedNote) {
            // For note context, get the note's waveform
            return selectedNote.note.synthesis?.waveform || 'sine';
        }
        return 'sine'; // Default fallback
    }, [context, selectedKey, selectedNote, globalWaveform, keyboardState]);

    // Combined background handler for mouseDown
    const handleBackgroundMouseDown = useCallback((e: React.MouseEvent) => {
        setIsPressed(true);
        // Only trigger panel toggle if it's not already visible
        if (!isPanelVisible) {
            dispatch(togglePanel());
        }
    }, [dispatch, isPanelVisible]);

    // Combined background handler for mouseUp - no longer changes context
    const handleBackgroundMouseUp = useCallback(() => {
        setIsPressed(false);
        setClickedOnControl(false);
    }, []);

    // Handler for mouseDown on control elements
    const handleControlMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setClickedOnControl(true);
    }, []);

    // Mouse leave handler
    const handleMouseLeave = useCallback(() => {
        setIsPressed(false);
        setClickedOnControl(false);
    }, []);

    // Keep local and Redux state in sync
    React.useEffect(() => {
        if (reduxParameterContext !== context) {
            setContext(reduxParameterContext);
        }
    }, [reduxParameterContext, context]);

    // Get parameters by group for the current context
    const allParameters = parameters.filter(p => p.contexts.includes(context) && p.group !== 'unison');

    // Get context-specific title
    const contextTitle = context === 'keyboard' ? 'Keyboard Parameters' : 'Note Parameters';

    return (
        <div className="w-full max-w-md relative">
            {/* SVG container with mask and visual styling - updated dimensions */}
            <svg
                viewBox="0 0 235 450"
                className="w-full h-auto"
                style={{ maxWidth: '100%' }}
            >
                <defs>
                    {/* Create a mask from the container path */}
                    <mask id="panel-mask">
                        <path
                            d={containerPath}
                            fill="white"
                        />
                    </mask>

                    <linearGradient id="keyGradient" x1="0" y1="222.729" x2="233.713" y2="222.729" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F5F2ED"/>
                        <stop offset="1" stopColor="#E8E4DF"/>
                    </linearGradient>

                    {/* Container shadow filters - extremely subtle like keyboard */}
                    <filter id="container-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="1" dy="1" stdDeviation="1.5" floodColor="#d1cdc4" floodOpacity="0.4" />
                        <feDropShadow dx="-1" dy="-1" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.5" />
                    </filter>

                    <filter id="container-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feOffset dx="1" dy="1" />
                        <feGaussianBlur stdDeviation="1" result="offset-blur" />
                        <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                        <feFlood floodColor="#c8c4bb" floodOpacity="0.5" result="color" />
                        <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                        <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                    </filter>
                </defs>

                {/* Visual container shape - using the gradient from PARAMS (3).svg */}
                <path
                    d={containerPath}
                    className="transition-all duration-75"
                    style={{
                        fill: "url(#keyGradient)",
                        filter: isPressed ? "url(#container-inner-shadow)" : "url(#container-shadow)",
                        stroke: isPressed ? "#d1cdc4" : "#e8e4df",
                        strokeWidth: "0.5",
                    }}
                />

                {/* Extremely subtle highlight - barely visible like keyboard */}
                <path
                    d={containerPath}
                    stroke={isPressed ? "#e0dbd6" : "#ffffff"}
                    strokeOpacity={isPressed ? "0.3" : "0.5"}
                    strokeWidth="0.75"
                    fill="none"
                    style={{
                        transform: 'scale(0.998)',
                        transformOrigin: 'center',
                    }}
                />

                {/* Foreign object that is masked to the SVG shape - updated dimensions */}
                <foreignObject
                    x="0"
                    y="0"
                    width="235"
                    height="450"
                    mask="url(#panel-mask)"
                >
                    {/* Clickable div that's masked to the SVG shape */}
                    <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        className="w-full h-full cursor-pointer"
                        style={{
                            transform: isPressed ? 'translateY(2px)' : 'translateY(0)',
                            transition: 'transform 100ms ease-in-out',
                        }}
                        onMouseDown={handleBackgroundMouseDown}
                        onMouseUp={handleBackgroundMouseUp}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Content container - with reduced padding */}
                        {isPanelVisible && (
                            <div
                                className="p-6"
                                style={{
                                    opacity: isPanelVisible && !isPressed ? 1 : 0,
                                    transition: 'opacity 150ms ease-in-out',
                                    pointerEvents: isPanelVisible && !isPressed ? 'auto' : 'none',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-3">
                                    {/* Parameter Groups */}
                                    <div className="space-y-4" onMouseDown={handleControlMouseDown}>
                                        {/* Add Waveform Controls here */}
                                        <div className="mb-4" onMouseDown={handleControlMouseDown}>
                                            {/* Waveform Controls are now handled directly in TunableKeyboard component */}
                                            {/* 
                                            <WaveformControls
                                                currentWaveform={getCurrentWaveform()}
                                                onWaveformChange={handleWaveformChange}
                                            />
                                            */}
                                        </div>

                                        <div>
                                            {/* Control elements with SVG sliders */}
                                            <div onMouseDown={handleControlMouseDown}>
                                                {allParameters.map(param => (
                                                    <SVGSlider
                                                        key={param.id}
                                                        parameterId={param.id}
                                                        value={parameterValues[param.id]?.value ?? param.defaultValue}
                                                        min={param.min}
                                                        max={param.max}
                                                        step={param.step}
                                                        unit={param.unit || ''}
                                                        precision={param.precision || 0}
                                                        isMixed={parameterValues[param.id]?.isMixed}
                                                        onChange={(value) => handleParameterUpdate(param.id, value)}
                                                        trackColor={currentTrackColor}
                                                    />
                                                ))}
                                            </div>

                                            {/* Add Unison Controls with SVG sliders - reduced margin */}
                                            <SVGUnisonGroup
                                                context={context}
                                                values={parameterValues}
                                                onParameterChange={handleParameterUpdate}
                                                currentTrackColor={currentTrackColor}
                                                onMouseDown={handleControlMouseDown}
                                                className="mt-0"
                                            />

                                            {/* Layout and Color Controls with reduced margin */}
                                            <div
                                                className="mt-4 pt-3 border-t border-gray-200"
                                                onMouseDown={handleControlMouseDown}
                                            >
                                                <KeyboardLayoutToggle />
                                                <ColorPicker />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </foreignObject>
            </svg>
        </div>
    );
};

export default ParameterPanel;