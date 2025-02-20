import React, { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsPanelVisible, togglePanel } from '../../keyboard/store/slices/keyboard.slice';
import { useParameterValues } from '../hooks/useParameterValues';
import { parameters } from '../constants/parameters';
import { ParameterContext } from '../types/types';
// import { getColorWithOpacity } from '../../../shared/constants/colors';

const ParameterPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const isPanelVisible = useAppSelector(selectIsPanelVisible);
    // Get current track color
    const currentTrack = useAppSelector(state => state.player.currentTrack);
    const tracks = useAppSelector(state => state.player.tracks);
    const currentTrackColor = tracks[currentTrack]?.color;

    // Rest of your state setups...
    const [isPressed, setIsPressed] = useState(false);
    const [context, setContext] = useState<ParameterContext>('keyboard');
    const { parameterValues, handleParameterUpdate } = useParameterValues(context);
    const [clickedContainer, setClickedContainer] = useState(false);

    // Your existing handlers...
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

    // Organize parameters by their functional groups
    const groups = {
        note: parameters.filter(p => p.group === 'note' && p.contexts.includes(context)),
        envelope: parameters.filter(p => p.group === 'envelope' && p.contexts.includes(context)),
        filter: parameters.filter(p => p.group === 'filter' && p.contexts.includes(context))
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-md p-6 bg-[#e5e9ec] rounded-3xl cursor-pointer relative"
            style={getContainerStyle()}
        >
            <div
                className="space-y-6"
                style={{
                    opacity: isPanelVisible && !isPressed ? 1 : 0,
                    transition: 'opacity 150ms ease-in-out',
                    pointerEvents: isPanelVisible && !isPressed ? 'auto' : 'none'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm font-medium text-gray-700">
                        {context === 'note' ? 'Note' : 'Key'}
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
                                                            (parameterValues[param.id]?.value ?? param.defaultValue) - param.step
                                                        )}
                                                        className="px-2 py-1 rounded text-xs"
                                                        style={{
                                                            backgroundColor: currentTrackColor,
                                                            color: 'white'
                                                        }}
                                                    >
                                                        ←
                                                    </button>
                                                    <button
                                                        onClick={() => handleParameterUpdate(
                                                            param.id,
                                                            (parameterValues[param.id]?.value ?? param.defaultValue) + param.step
                                                        )}
                                                        className="px-2 py-1 rounded text-xs"
                                                        style={{
                                                            backgroundColor: currentTrackColor,
                                                            color: 'white'
                                                        }}
                                                    >
                                                        →
                                                    </button>
                                                </>
                                            )}
                                            <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">
                                                {parameterValues[param.id]?.isMixed ?
                                                    '---' :
                                                    `${parameterValues[param.id]?.value ?? param.defaultValue}${param.unit}`
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        className={`relative h-2 bg-[#e5e9ec] rounded-full ${
                                            parameterValues[param.id]?.isMixed ? 'opacity-50' : ''
                                        }`}
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
                                            onChange={(e) => handleParameterUpdate(param.id, Number(e.target.value))}
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
                                                transition: 'background-color 300ms ease-in-out, opacity 300ms ease-in-out'  // Add this line
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