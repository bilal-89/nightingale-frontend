// src/features/parameters/components/ParameterPanel.tsx

import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsPanelVisible, togglePanel } from '../../keyboard/store/slices/keyboard.slice';
import { useParameterValues } from '../hooks/useParameterValues';
import { parameters } from '../constants/parameters';
import { ParameterContext } from '../types/types';
import UnisonControls from '../../keyboard/components/UnisonControls';

const ParameterPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const isPanelVisible = useAppSelector(selectIsPanelVisible);
    const currentTrack = useAppSelector(state => state.player.currentTrack);
    const tracks = useAppSelector(state => state.player.tracks);
    const currentTrackColor = tracks[currentTrack]?.color;

    const [isPressed, setIsPressed] = useState(false);
    const [context, setContext] = useState<ParameterContext>('keyboard');
    const { parameterValues, handleParameterUpdate } = useParameterValues(context);
    const [clickedContainer, setClickedContainer] = useState(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsPressed(true);
            setClickedContainer(true);
            if (!isPanelVisible) {
                dispatch(togglePanel());
            }
        }
    }, [dispatch, isPanelVisible]);

    const handleMouseUp = useCallback(() => {
        if (isPressed && clickedContainer) {
            setContext(prev => prev === 'keyboard' ? 'note' : 'keyboard');
        }
        setIsPressed(false);
        setClickedContainer(false);
    }, [isPressed, clickedContainer]);

    const handleMouseLeave = useCallback(() => {
        setIsPressed(false);
        setClickedContainer(false);
    }, []);

    const getContainerStyle = () => ({
        transition: 'all 100ms ease-in-out',
        ...(isPressed ? {
            boxShadow: 'inset 2px 2px 5px #c8ccd0, inset -2px -2px 5px #ffffff',
            transform: 'translateY(1px)',
            border: '1px solid rgba(255, 255, 255, 0.9)'
        } : {
            boxShadow: '4px 4px 10px #c8ccd0, -4px -4px 10px #ffffff',
            transform: 'translateY(0)',
            border: '1px solid rgba(255, 255, 255, 0.7)'
        })
    });

    // Get all parameters for the current context
    const allParameters = parameters.filter(p => p.contexts.includes(context));

    const renderParameter = (param: typeof parameters[0]) => (
        <div key={param.id} className="parameter-control mb-4">
            <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-gray-500">
                    {param.label || param.id}
                </span>
                <span className="text-sm font-medium text-gray-700">
                    {parameterValues[param.id]?.value.toFixed(param.precision || 0)} {param.unit}
                </span>
            </div>
            <div
                className="relative h-2 bg-[#e5e9ec] rounded-full"
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
                        boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                        opacity: parameterValues[param.id]?.isMixed ? 0.5 : 0.8,
                        transition: 'background-color 300ms ease-in-out, opacity 300ms ease-in-out'
                    }}
                />
            </div>
        </div>
    );

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-md p-7 bg-[#e5e9ec] rounded-3xl cursor-pointer relative"
            style={getContainerStyle()}
        >
            <div
                className="space-y-4"
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
                    {allParameters.map(renderParameter)}
                    
                    {/* Add Unison Controls - show in both contexts */}
                    <UnisonControls />
                </div>
            </div>
        </div>
    );
};

export default ParameterPanel;