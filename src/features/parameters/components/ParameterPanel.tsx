import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsPanelVisible, togglePanel } from '../../../store/slices/keyboard/keyboard.slice';
// import { selectSelectedNote } from '../../player/state/slices/player.slice';
import { useParameterContext } from '../hooks/useParameterContext';
import { useParameterValues } from '../hooks/useParameterValues';
import { parameters } from '../constants/parameters';

/**
 * A streamlined parameter panel that maintains the clean aesthetic of the original
 * while providing enhanced parameter organization and context awareness.
 */
const ParameterPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const isPanelVisible = useAppSelector(selectIsPanelVisible);
    // const selectedNote = useAppSelector(selectSelectedNote);
    const [isPressed, setIsPressed] = useState(false);

    // Get current context and parameter values
    const activeContext = useParameterContext();
    const { parameterValues, handleParameterUpdate } = useParameterValues(activeContext);

    // Organize parameters by their groups
    const groups = {
        note: parameters.filter(p => p.group === 'note' && p.contexts.includes(activeContext)),
        envelope: parameters.filter(p => p.group === 'envelope' && p.contexts.includes(activeContext)),
        filter: parameters.filter(p => p.group === 'filter' && p.contexts.includes(activeContext))
    };

    // Panel style based on interaction state
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
            onClick={() => dispatch(togglePanel())}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            className="w-full max-w-md p-6 bg-[#e5e9ec] rounded-3xl cursor-pointer relative"
            style={getContainerStyle()}
        >
            <div
                className="space-y-6"
                style={{
                    opacity: isPanelVisible ? 1 : 0,
                    transition: 'opacity 150ms ease-in-out',
                    pointerEvents: isPanelVisible ? 'auto' : 'none'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Panel header */}
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm font-medium text-gray-700">
                        {activeContext === 'note' ? 'Note Parameters' : 'Keyboard Parameters'}
                    </div>
                    {/*{selectedNote && activeContext === 'note' && (*/}
                    {/*    <div className="text-xs text-gray-500">*/}
                    {/*        Note: {selectedNote.note.note}*/}
                    {/*    </div>*/}
                    {/*)}*/}
                </div>

                {/* Parameter groups */}
                <div className="space-y-6">
                    {Object.entries(groups).map(([groupName, groupParams]) => (
                        <div key={groupName} className="space-y-4">
                            {/* Group parameters */}
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
                                            {param.extraControls && activeContext === 'note' && (
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

                                    {/* Parameter slider */}
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