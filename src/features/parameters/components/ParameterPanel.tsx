// src/features/parameters/components/ParameterPanel.tsx

import React, { useState, useCallback, useRef } from 'react';
import {
    selectIsPanelVisible,
    togglePanel,
    setParameterContext
} from '../../keyboard/store/slices/keyboard.slice';
import { useParameterValues } from '../hooks/useParameterValues';
import { parameters } from '../constants/parameters';
import { ParameterContext } from '../types/types';
import { NoteColor } from '../../../shared/constants/colors.ts';
import { ColorStrip } from '../../../shared/components/ui/ColorStrip';
import { setTrackSettings } from '../../player/store/player';
import { getMutedColor } from '../../../shared/constants/colors';

import UnisonGroup from './groups/UnisonGroup';

import {toggleKeyboardLayout} from '../../keyboard/store/slices/keyboard.slice';
import {useAppDispatch, useAppSelector} from "../../player/hooks";
import {Keyboard} from "lucide-react";

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
            <div className="text-xs font-medium text-gray-500 mb-2">Track Color</div>
            <ColorStrip
                selectedColor={displayColor}
                onColorSelect={handleColorSelect}
            />
        </div>
    );
};

const ParameterPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const isPanelVisible = useAppSelector(selectIsPanelVisible);
    const currentTrack = useAppSelector(state => state.player.currentTrack);
    const tracks = useAppSelector(state => state.player.tracks);
    const currentTrackColor = tracks[currentTrack]?.color;
    const reduxParameterContext = useAppSelector(state => state.keyboard.parameterContext);

    const [isPressed, setIsPressed] = useState(false);
    const [context, setContext] = useState<ParameterContext>('keyboard');
    const { parameterValues, handleParameterUpdate } = useParameterValues(context);
    const [clickedContainer, setClickedContainer] = useState(false);

    // Improved mouse event handlers for better click detection
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        console.log("Mouse down on parameter panel");
        setIsPressed(true);
        setClickedContainer(true);
        if (!isPanelVisible) {
            dispatch(togglePanel());
        }
    }, [dispatch, isPanelVisible]);

    const handleMouseUp = useCallback(() => {
        console.log("Mouse up on parameter panel", { isPressed, clickedContainer });
        if (isPressed && clickedContainer) {
            // Toggle context on click
            const newContext = context === 'keyboard' ? 'note' : 'keyboard';
            console.log("Changing context to:", newContext);
            setContext(newContext);
            // Update Redux state too
            dispatch(setParameterContext(newContext));
        }
        setIsPressed(false);
        setClickedContainer(false);
    }, [isPressed, clickedContainer, context, dispatch]);

    const handleMouseLeave = useCallback(() => {
        console.log("Mouse leave on parameter panel");
        setIsPressed(false);
        setClickedContainer(false);
    }, []);

    // Keep local and Redux state in sync
    React.useEffect(() => {
        if (reduxParameterContext !== context) {
            setContext(reduxParameterContext);
        }
    }, [reduxParameterContext, context]);

    // Get parameters by group for the current context
    const allParameters = parameters.filter(p => p.contexts.includes(context));

    const renderParameter = (param: typeof parameters[0]) => (
        <div key={param.id} className="parameter-control mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">
                    {param.name}
                </span>
                <span className="text-sm font-medium text-gray-700">
                    {parameterValues[param.id]?.isMixed
                        ? '---'
                        : `${(parameterValues[param.id]?.value || 0).toFixed(param.precision || 0)}${param.unit || ''}`}
                </span>
            </div>
            <div
                className="relative h-2 bg-[#f5f2ed] rounded-full"
                style={{
                    boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
                }}
            >
                <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={parameterValues[param.id]?.value ?? param.defaultValue}
                    onChange={(e) => handleParameterUpdate(param.id, parseFloat(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                />
                <div
                    className="absolute h-full rounded-full"
                    style={{
                        width: `${((parameterValues[param.id]?.value ?? param.defaultValue) - param.min) /
                        (param.max - param.min) * 100}%`,
                        backgroundColor: currentTrackColor,
                        boxShadow: '2px 2px 2px rgba(0,0,0,0.1)',
                        opacity: parameterValues[param.id]?.isMixed ? 0.5 : 0.8,
                        transition: 'background-color 300ms ease-in-out, opacity 300ms ease-in-out'
                    }}
                />
            </div>
        </div>
    );

    // Using a simplified approach with a single div for clickability
    const containerStyle = {
        transition: 'all 100ms ease-in-out',
        ...(isPressed ? {
            boxShadow: 'inset 2px 2px 2px #e8e4dc, inset -2px -2px 5px #ffffff',
            transform: 'translateY(1px)',
        } : {
            boxShadow: '3px 2px 10px #c8ccd0, -4px -4px 10px #ffffff',
            transform: 'translateY(0)',
        })
    };

    return (
        <div className="relative">
            {/* Clickable container div with background SVG */}
            <div
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="w-full max-w-md p-9 bg-[#f5f2ed] opacity-100 rounded-3xl cursor-pointer relative"
                style={containerStyle}
            >
                {/* SVG as a background element */}
                <div
                    className="absolute inset-0 z-0 overflow-hidden rounded-3xl"
                    style={{
                        // backgroundImage: `url("data:image/svg+xml,%3Csvg width='290' height='1106' viewBox='0 0 290 1106' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 103.006V32.1621C3 17.8027 14.6406 6.16217 29 6.16217H73.8298H214.283H259.445C273.804 6.16217 285.445 17.8028 285.445 32.1622V103.006V270.36V548.057V825.754V993.108L286.62 1074.63C286.829 1089.13 275.129 1101 260.623 1101H216.413H81.9926H29C14.6406 1101 3 1089.36 3 1075V993.108V825.754V548.057V270.36V103.006Z' fill='${encodeURIComponent("#F5F2ED")}' opacity='0.2'/%3E%3Cpath d='M32 6.16217C17.6406 6.16217 6 17.8028 6 32.1622L6 101.899V269.439V547.445V825.45V992.99V1074C6 1088.36 17.6406 1100 32 1100H215.564H256.94C271.3 1100 282.94 1088.36 282.94 1074V992.99V825.45V547.445V269.439V183.89V101.899L283.71 33.2623C283.871 18.9814 272.482 7.24471 258.203 6.97524L215.118 6.16217H144.47H73.8221H32Z' stroke='${encodeURIComponent("#B5D16B")}' stroke-opacity='0.3' stroke-width='${isPressed ? 6 : 9}'/%3E%3C/svg%3E")`,
                        backgroundPosition: 'center',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.8,
                    }}
                />

                {/* Content container */}
                <div
                    className="relative z-10 space-y-4"
                    style={{
                        opacity: isPanelVisible && !isPressed ? 1 : 0,
                        transition: 'opacity 150ms ease-in-out',
                        pointerEvents: isPanelVisible && !isPressed ? 'auto' : 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-700">
                            {context === 'note' ? 'Note Parameters' : 'Key Parameters'}
                        </div>
                    </div>

                    <div>
                        {/* Render all parameters in a flat list */}
                        {allParameters.filter(p => p.group !== 'unison').map(renderParameter)}

                        {/* Add Unison Controls - show in both contexts */}
                        <UnisonGroup
                            context={context}
                            values={parameterValues}
                            onParameterChange={handleParameterUpdate}
                            currentTrackColor={currentTrackColor}
                        />

                        {/* Layout and Color Controls */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-500 mb-3">Interface Controls</div>
                            <KeyboardLayoutToggle />
                            <ColorPicker />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParameterPanel;