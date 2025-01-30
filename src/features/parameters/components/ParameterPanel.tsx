import React, { useMemo, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
    selectIsPanelVisible,
    setKeyParameter,
    togglePanel
} from '../../../store/slices/keyboard/keyboard.slice';
import { useParameters } from '../../player/hooks/useParameters';
import { selectSelectedNote } from '../../player/state/slices/player.slice';

// Define the possible contexts our parameter panel can be in
type ParameterContext = 'keyboard' | 'note';

// Define the structure of a parameter with all its properties
interface Parameter {
    id: string;
    name: string;
    min: number;
    max: number;
    step: number;
    unit?: string;
    defaultValue: number;
    contexts: ParameterContext[];
    extraControls?: boolean;
    group?: 'envelope' | 'note';
}

// Define all available parameters for both keyboard and note contexts
const parameters: Parameter[] = [
    {
        id: 'tuning',
        name: 'Tuning',
        min: -100,
        max: 100,
        step: 1,
        unit: 'cents',
        defaultValue: 0,
        contexts: ['keyboard', 'note'],
        group: 'note'
    },
    {
        id: 'velocity',
        name: 'Velocity',
        min: 0,
        max: 127,
        step: 1,
        defaultValue: 100,
        contexts: ['keyboard', 'note'],
        group: 'note'
    },
    // ADSR parameters - available in both contexts
    {
        id: 'attack',
        name: 'Attack',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 50,
        contexts: ['keyboard', 'note'],
        group: 'envelope'
    },
    {
        id: 'decay',
        name: 'Decay',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 100,
        contexts: ['keyboard', 'note'],
        group: 'envelope'
    },
    {
        id: 'sustain',
        name: 'Sustain',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        defaultValue: 70,
        contexts: ['keyboard', 'note'],
        group: 'envelope'
    },
    {
        id: 'release',
        name: 'Release',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 150,
        contexts: ['keyboard', 'note'],
        group: 'envelope'
    },
    // Note-specific parameters
    {
        id: 'microTiming',
        name: 'Micro-timing',
        min: -50,
        max: 50,
        step: 1,
        unit: 'ms',
        defaultValue: 0,
        contexts: ['note'],
        extraControls: true,
        group: 'note'
    }
];

// Individual parameter control component for displaying and editing a single parameter
const ParameterControl: React.FC<{
    parameter: Parameter;
    value: number;
    onChange: (value: number) => void;
    showExtraControls?: boolean;
}> = ({ parameter, value, onChange, showExtraControls }) => {
    return (
        <div className="p-4 rounded-2xl bg-[#e5e9ec]"
             style={{
                 boxShadow: 'inset 4px 4px 8px #c8ccd0, inset -4px -4px 8px #ffffff'
             }}>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                    {parameter.name}
                </label>
                <div className="flex items-center gap-2">
                    {showExtraControls && (
                        <>
                            <button
                                onClick={() => onChange(value - parameter.step)}
                                className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                            >
                                ←
                            </button>
                            <button
                                onClick={() => onChange(value + parameter.step)}
                                className="px-2 py-1 rounded bg-blue-500 text-white text-xs"
                            >
                                →
                            </button>
                        </>
                    )}
                    <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">
                        {value}{parameter.unit}
                    </span>
                </div>
            </div>

            <div className="relative h-2 bg-[#e5e9ec] rounded-full mb-2"
                 style={{
                     boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
                 }}>
                <input
                    type="range"
                    min={parameter.min}
                    max={parameter.max}
                    step={parameter.step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute h-full bg-blue-500 rounded-full"
                     style={{
                         width: `${((value - parameter.min) / (parameter.max - parameter.min)) * 100}%`,
                         boxShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                     }}
                />
            </div>
        </div>
    );
};

// Main parameter panel component
const ParameterPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedKey = useAppSelector(state => state.keyboard.selectedKey);
    const selectedNote = useAppSelector(selectSelectedNote);
    const isPanelVisible = useAppSelector(selectIsPanelVisible);
    const [isPressed, setIsPressed] = useState(false);
    const { handleParameterChange, parameterService } = useParameters();
    const keyboardActiveNotes = useAppSelector(state => state.keyboard.activeNotes);
    const keyParameters = useAppSelector(state => state.keyboard.keyParameters);
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);

    // Add state for managing context and keyboard interaction
    const [activeContext, setActiveContext] = useState<ParameterContext>('keyboard');
    const [lastKeyboardInteraction, setLastKeyboardInteraction] = useState(0);


    // Effect to handle keyboard interactions
    useEffect(() => {
        // We'll consider the keyboard active only when:
        // 1. There are currently notes being played (keyboardActiveNotes > 0)
        // OR
        // 2. A key was just clicked/selected (selectedKey !== null)
        const isCurrentlyActive = keyboardActiveNotes > 0 || selectedKey !== null;

        if (isCurrentlyActive) {
            setIsKeyboardActive(true);
            setActiveContext('keyboard');
        } else {
            // If no keys are being played or selected, the keyboard is inactive
            setIsKeyboardActive(false);

            // If we have a selected note and the keyboard just became inactive,
            // we should switch to note context
            if (selectedNote) {
                setActiveContext('note');
            }
        }
    }, [selectedKey, keyboardActiveNotes, selectedNote]);

    useEffect(() => {
        if (selectedNote && !isKeyboardActive) {
            // Only switch to note context if the keyboard isn't being used
            setActiveContext('note');
        }
    }, [selectedNote, isKeyboardActive]);

    // Enhanced selector to handle both contexts and value conversion
    const parameterValues = useMemo(() => {
        if (activeContext === 'note' && selectedNote) {
            return parameters.reduce((values, param) => {
                if (!param.contexts.includes('note')) return values;

                let rawValue;
                if (param.group === 'envelope') {
                    rawValue = selectedNote.note.synthesis?.envelope?.[param.id];
                } else {
                    rawValue = selectedNote.note[param.id];
                }

                // Direct value handling for note parameters
                values[param.id] = rawValue ?? param.defaultValue;
                return values;
            }, {} as Record<string, number>);
        }

        if (activeContext === 'keyboard' && selectedKey !== null) {
            return parameters.reduce((values, param) => {
                if (!param.contexts.includes('keyboard')) return values;

                // We now correctly access the parameter value from the keyboard parameters state
                const keyValue = keyParameters[selectedKey]?.[param.id]?.value;
                values[param.id] = keyValue ?? param.defaultValue;
                return values;
            }, {} as Record<string, number>);
        }

        return {};
    }, [activeContext, selectedKey, selectedNote, keyParameters]); // Added keyParameters to dependencies

    // Panel interaction handlers
    const handlePanelClick = () => dispatch(togglePanel());
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsPressed(false);

    // Parameter update handler for both contexts
    const handleParameterUpdate = useMemo(() => (
        (parameterId: string, value: number) => {
            if (activeContext === 'keyboard' && selectedKey !== null) {
                dispatch(setKeyParameter({
                    keyNumber: selectedKey,
                    parameter: parameterId as any,
                    value
                }));
            } else if (activeContext === 'note' && selectedNote) {
                // For notes, we're already getting the display value from the slider
                handleParameterChange(
                    selectedNote.trackId,
                    selectedNote.note.id,
                    parameterId,
                    value  // This is already in display value format
                );
            }
        }
    ), [dispatch, selectedKey, selectedNote, activeContext, handleParameterChange]);

    // Show only parameters relevant to current context
    const availableParameters = parameters.filter(param =>
        param.contexts.includes(activeContext)
    );

    // Calculate panel height based on visible parameters
    const totalParameterHeight = availableParameters.length * 96;

    // Get container style based on press state
    const getContainerStyle = () => {
        const baseStyle = {
            height: `${totalParameterHeight + 48}px`,
            transition: 'all 100ms ease-in-out',
        };

        if (isPressed) {
            return {
                ...baseStyle,
                boxShadow: 'inset 2px 2px 5px #c8ccd0, inset -2px -2px 5px #ffffff',
                transform: 'translateY(1px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
            };
        }

        return {
            ...baseStyle,
            boxShadow: '4px 4px 10px #c8ccd0, -4px -4px 10px #ffffff',
            transform: 'translateY(0)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
        };
    };

    return (
        <div
            onClick={handlePanelClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-md p-6 bg-[#e5e9ec] rounded-3xl cursor-pointer relative"
            style={getContainerStyle()}
        >
            <div className="space-y-4"
                 style={{
                     opacity: isPanelVisible ? 1 : 0,
                     transition: 'opacity 150ms ease-in-out',
                     pointerEvents: isPanelVisible ? 'auto' : 'none'
                 }}
                 onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium text-gray-700">
                        {activeContext === 'note' ? 'Note Parameters' : 'Keyboard Parameters'}
                    </div>
                    {selectedNote && activeContext === 'note' && (
                        <div className="text-xs text-gray-500">
                            Note: {selectedNote.note.note}
                        </div>
                    )}
                </div>

                {availableParameters.map(param => (
                    <ParameterControl
                        key={param.id}
                        parameter={param}
                        value={parameterValues[param.id] ?? param.defaultValue}
                        onChange={(value) => handleParameterUpdate(param.id, value)}
                        showExtraControls={param.extraControls && activeContext === 'note'}
                    />
                ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center"
                 style={{
                     opacity: isPanelVisible ? 0 : 1,
                     transition: 'opacity 150ms ease-in-out',
                     pointerEvents: isPanelVisible ? 'none' : 'auto'
                 }}>
            </div>
        </div>
    );
};

export default ParameterPanel;