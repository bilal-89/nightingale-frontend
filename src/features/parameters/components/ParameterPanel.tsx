import React, { useMemo, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
    selectIsPanelVisible,
    setKeyParameter,
    togglePanel,
    KeyParameters
} from '../../../store/slices/keyboard/keyboard.slice';
import { useParameters } from '../../player/hooks/useParameters';
import { selectSelectedNote } from '../../player/state/slices/player.slice';

// Define our possible parameter contexts and groups
type ParameterContext = 'keyboard' | 'note';
type ParameterGroup = 'envelope' | 'note' | 'filter';  // Added 'filter' to groups

// Define our parameter interface with strong typing
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
    group?: ParameterGroup;  // Updated to use ParameterGroup type
}

// Define all available parameters including new filter controls
const parameters: Parameter[] = [
    // Note parameters
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
    },
    // ADSR Envelope parameters
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
    // Filter parameters
    {
        id: 'filterCutoff',
        name: 'Filter Cutoff',
        min: 20,
        max: 20000,
        step: 1,
        unit: 'Hz',
        defaultValue: 20000,
        contexts: ['keyboard', 'note'],
        group: 'filter',

    },
    {
        id: 'filterResonance',
        name: 'Resonance',
        min: 0,
        max: 20,
        step: 0.1,
        unit: 'Q',
        defaultValue: 0.707,
        contexts: ['keyboard', 'note'],
        group: 'filter'
    }
];

const isValidParameterId = (id: string): id is keyof KeyParameters => {
    return ['tuning', 'velocity', 'attack', 'decay', 'sustain', 'release', 'filterCutoff', 'filterResonance'].includes(id);
};

const isEnvelopeParam = (id: string): id is keyof typeof selectedNote.note.synthesis.envelope => {
    return ['attack', 'decay', 'sustain', 'release'].includes(id);
};

const ParameterControl: React.FC<{
    parameter: Parameter;
    value: number;
    onChange: (value: number) => void;
    showExtraControls?: boolean;
}> = ({ parameter, value, onChange, showExtraControls }) => {
    // Transform value for display in the slider
    const getSliderValue = (param: Parameter, val: number) => {
        if (param.id === 'filterCutoff') {
            // Convert frequency to logarithmic position (0-100)
            return Math.round((Math.log(val) - Math.log(param.min)) /
                (Math.log(param.max) - Math.log(param.min)) * 100);
        }
        return val;
    };

    // Transform slider value back to frequency
    const getFrequencyValue = (param: Parameter, val: number) => {
        if (param.id === 'filterCutoff') {
            // Convert slider position (0-100) to frequency
            const minLog = Math.log(param.min);
            const maxLog = Math.log(param.max);
            return Math.round(Math.exp(minLog + (val / 100) * (maxLog - minLog)));
        }
        return val;
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        if (parameter.id === 'filterCutoff') {
            // For filter cutoff, convert from slider position to frequency
            onChange(getFrequencyValue(parameter, newValue));
        } else {
            onChange(newValue);
        }
    };

    // Calculate the visual progress for the slider
    const getProgressWidth = () => {
        const displayValue = getSliderValue(parameter, value);
        const min = parameter.id === 'filterCutoff' ? 0 : parameter.min;
        const max = parameter.id === 'filterCutoff' ? 100 : parameter.max;
        return `${((displayValue - min) / (max - min)) * 100}%`;
    };

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
                    min={parameter.id === 'filterCutoff' ? 0 : parameter.min}
                    max={parameter.id === 'filterCutoff' ? 100 : parameter.max}
                    step={parameter.id === 'filterCutoff' ? 1 : parameter.step}
                    value={getSliderValue(parameter, value)}
                    onChange={handleSliderChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute h-full bg-blue-500 rounded-full"
                     style={{
                         width: getProgressWidth(),
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
    const { handleParameterChange } = useParameters();
    const keyboardActiveNotes = useAppSelector(state => state.keyboard.activeNotes);
    const keyParameters = useAppSelector(state => state.keyboard.keyParameters);
    const [activeContext, setActiveContext] = useState<ParameterContext>('keyboard');

    // Context switching effects
    useEffect(() => {
        const isCurrentlyActive = keyboardActiveNotes.length > 0 || selectedKey !== null;
        if (isCurrentlyActive) {
            setActiveContext('keyboard');
        } else if (selectedNote) {
            setActiveContext('note');
        }
    }, [selectedKey, keyboardActiveNotes, selectedNote]);

    // Parameter value management
    const parameterValues = useMemo(() => {
        if (activeContext === 'note' && selectedNote) {
            const values = parameters.reduce((acc, param) => {
                let rawValue;

                switch (param.group) {
                    case 'filter':
                        // Handle filter parameters specifically
                        rawValue = param.id === 'filterCutoff'
                            ? selectedNote.note.synthesis?.effects?.filter?.frequency
                            : selectedNote.note.synthesis?.effects?.filter?.Q;
                        break;
                    case 'envelope':
                        if (isEnvelopeParam(param.id)) {
                            rawValue = selectedNote.note.synthesis?.envelope?.[param.id];
                        }
                        break;
                    default:
                        rawValue = selectedNote.note[param.id];
                }

                console.log(`Parameter ${param.id}:`, { rawValue }); // Debug log
                acc[param.id] = rawValue ?? param.defaultValue;
                return acc;
            }, {} as Record<string, number>);

            return values;
        }

        if (activeContext === 'keyboard' && selectedKey !== null) {
            return parameters.reduce((values, param) => {
                if (isValidParameterId(param.id)) {
                    const keyValue = keyParameters[selectedKey]?.[param.id]?.value;
                    values[param.id] = keyValue ?? param.defaultValue;
                }
                return values;
            }, {} as Record<string, number>);
        }

        return {};
    }, [activeContext, selectedKey, selectedNote, keyParameters]);


    // Interaction handlers
    const handlePanelClick = () => dispatch(togglePanel());
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsPressed(false);

    const handleParameterUpdate = useMemo(() => (
        (parameterId: string, value: number) => {
            console.log('Parameter update:', { parameterId, value }); // Debug log

            if (activeContext === 'keyboard' && selectedKey !== null) {
                dispatch(setKeyParameter({
                    keyNumber: selectedKey,
                    parameter: parameterId,
                    value
                }));
            } else if (activeContext === 'note' && selectedNote) {
                handleParameterChange(
                    selectedNote.trackId,
                    selectedNote.note.id,
                    parameterId,
                    value
                );
            }
        }
    ), [dispatch, selectedKey, selectedNote, activeContext, handleParameterChange]);


    // Style management
    const getContainerStyle = () => {
        const baseStyle = {
            transition: 'all 100ms ease-in-out'
        };

        if (isPressed) {
            return {
                ...baseStyle,
                boxShadow: 'inset 2px 2px 5px #c8ccd0, inset -2px -2px 5px #ffffff',
                transform: 'translateY(1px)',
                border: '1px solid rgba(255, 255, 255, 0.9)'
            };
        }

        return {
            ...baseStyle,
            boxShadow: '4px 4px 10px #c8ccd0, -4px -4px 10px #ffffff',
            transform: 'translateY(0)',
            border: '1px solid rgba(255, 255, 255, 0.7)'
        };
    };

    // Organize parameters by group
    const parametersByGroup = useMemo(() => {
        const groups = new Map<ParameterGroup, Parameter[]>();
        parameters.forEach(param => {
            if (param.group && param.contexts.includes(activeContext)) {
                const group = groups.get(param.group) || [];
                group.push(param);
                groups.set(param.group, group);
            }
        });
        return groups;
    }, [activeContext]);

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

                {/* Render parameters by group */}
                {Array.from(parametersByGroup.entries()).map(([group, groupParams]) => (
                    <div key={group} className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                            {group.charAt(0).toUpperCase() + group.slice(1)}
                        </h3>
                        {groupParams.map(param => (
                            <ParameterControl
                                key={param.id}
                                parameter={param}
                                value={parameterValues[param.id] ?? param.defaultValue}
                                onChange={(value) => handleParameterUpdate(param.id, value)}
                                showExtraControls={param.extraControls && activeContext === 'note'}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParameterPanel;