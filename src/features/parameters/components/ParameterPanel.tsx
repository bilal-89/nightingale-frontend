import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsPanelVisible, togglePanel } from '../../keyboard/store/slices/keyboard.slice';
import { useParameterValues } from '../hooks/useParameterValues';
import { parameters } from '../constants/parameters';
import { ParameterContext } from '../types/types';

const ParameterPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const isPanelVisible = useAppSelector(selectIsPanelVisible);

    // Track both press state and context
    const [isPressed, setIsPressed] = useState(false);
    const [context, setContext] = useState<ParameterContext>('keyboard');

    // Get parameter values and update handler for current context
    const { parameterValues, handleParameterUpdate } = useParameterValues(context);

    // Organize parameters by their functional groups
    const groups = {
        note: parameters.filter(p => p.group === 'note' && p.contexts.includes(context)),
        envelope: parameters.filter(p => p.group === 'envelope' && p.contexts.includes(context)),
        filter: parameters.filter(p => p.group === 'filter' && p.contexts.includes(context))
    };

    // Track whether the click started on the container
    const [clickedContainer, setClickedContainer] = useState(false);

    // Handle mouse down - set states only if clicking the container directly
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Check if the click target is the container itself
        if (e.target === e.currentTarget) {
            setIsPressed(true);
            setClickedContainer(true);
            if (!isPanelVisible) {
                dispatch(togglePanel());
            }
        }
    }, [dispatch, isPanelVisible]);

    // Handle mouse up - switch context only if the click started on the container
    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (isPressed && clickedContainer) {
            setContext(prev => prev === 'keyboard' ? 'note' : 'keyboard');
        }
        setIsPressed(false);
        setClickedContainer(false);
    }, [isPressed, clickedContainer]);

    // Handle mouse leave - reset pressed state without switching context
    const handleMouseLeave = useCallback(() => {
        setIsPressed(false);
        setClickedContainer(false);
    }, []);

    // Visual feedback styles for press interaction
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

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-md p-6 bg-[#e5e9ec] rounded-3xl cursor-pointer relative"
            style={getContainerStyle()}
        >
            {/* Panel content container with visibility animation */}
            <div
                className="space-y-6"
                style={{
                    opacity: isPanelVisible && !isPressed ? 1 : 0,
                    transition: 'opacity 150ms ease-in-out',
                    pointerEvents: isPanelVisible && !isPressed ? 'auto' : 'none'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Rest of the component remains unchanged */}
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm font-medium text-gray-700">
                        {context === 'note' ? 'Note Parameters' : 'Keyboard Parameters'}
                    </div>
                </div>

                <div className="space-y-6">
                    {Object.entries(groups).map(([groupName, groupParams]) => (
                        <div key={groupName} className="space-y-4">
                            {groupParams.map(param => (
                                <div
                                    key={param.id}
                                    className="p-4 rounded-2xl bg-[#e5e9ec]"
                                    style={{
                                        boxShadow: 'inset 4px 4px 8px #c8ccd0, inset -4px -4px 8px #ffffff'
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            {param.name}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {param.extraControls && context === 'note' && (
                                                <>
                                                    <button
                                                        onClick={() => handleParameterUpdate(
                                                            param.id,
                                                            (parameterValues[param.id] ?? param.defaultValue) - param.step
                                                        )}
                                                        className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                                                    >
                                                        ←
                                                    </button>
                                                    <button
                                                        onClick={() => handleParameterUpdate(
                                                            param.id,
                                                            (parameterValues[param.id] ?? param.defaultValue) + param.step
                                                        )}
                                                        className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                                                    >
                                                        →
                                                    </button>
                                                </>
                                            )}
                                            <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">
                                                {parameterValues[param.id] ?? param.defaultValue}
                                                {param.unit}
                                            </span>
                                        </div>
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
                                            value={parameterValues[param.id] ?? param.defaultValue}
                                            onChange={(e) => handleParameterUpdate(param.id, Number(e.target.value))}
                                            className="absolute w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div
                                            className="absolute h-full bg-blue-500 rounded-full"
                                            style={{
                                                width: `${((parameterValues[param.id] ?? param.defaultValue) - param.min) /
                                                (param.max - param.min) * 100}%`,
                                                boxShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ParameterPanel;