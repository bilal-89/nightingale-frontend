import React, { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
    selectIsPanelVisible,
    selectParameter,
    setKeyParameter,
    togglePanel
} from '../../../store/slices/keyboard/keyboard.slice';
import { createSelector } from '@reduxjs/toolkit';

// Define our parameters with their ranges and default values
const parameters = [
    {
        id: 'tuning',
        name: 'Tuning',
        min: -100,
        max: 100,
        step: 1,
        unit: 'cents',
        defaultValue: 0
    },
    {
        id: 'velocity',
        name: 'Velocity',
        min: 0,
        max: 127,
        step: 1,
        defaultValue: 100
    },
    {
        id: 'attack',
        name: 'Attack',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 50
    },
    {
        id: 'decay',
        name: 'Decay',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 100
    },
    {
        id: 'sustain',
        name: 'Sustain',
        min: 0,
        max: 100,
        step: 1,
        unit: '%',
        defaultValue: 70
    },
    {
        id: 'release',
        name: 'Release',
        min: 0,
        max: 1000,
        step: 1,
        unit: 'ms',
        defaultValue: 150
    }
];

// Selector to efficiently get parameter values
const selectParameterValues = createSelector(
    [(state: any) => state.keyboard.keyParameters,
        (state: any) => state.keyboard.selectedKey],
    (keyParameters, selectedKey) => {
        if (selectedKey === null) return {};
        return parameters.reduce((values, param) => {
            const currentValue = keyParameters[selectedKey]?.[param.id]?.value;
            values[param.id] = currentValue ?? param.defaultValue;
            return values;
        }, {} as Record<string, number>);
    }
);

// Individual parameter control component
const ParameterControl: React.FC<{
    parameter: typeof parameters[0];
    value: number;
    onChange: (value: number) => void;
}> = ({ parameter, value, onChange }) => {
    return (
        <div className="p-4 rounded-2xl bg-[#e5e9ec]"
             style={{
                 boxShadow: 'inset 4px 4px 8px #c8ccd0, inset -4px -4px 8px #ffffff'
             }}>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                    {parameter.name}
                </label>
                <span className="text-sm text-gray-600 tabular-nums">
                    {value}{parameter.unit}
                </span>
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
    const parameterValues = useAppSelector(selectParameterValues);
    const isPanelVisible = useAppSelector(selectIsPanelVisible);
    const [isPressed, setIsPressed] = useState(false);

    const handlePanelClick = () => {
        dispatch(togglePanel());
    };

    // Handle press interactions
    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);
    const handleMouseLeave = () => setIsPressed(false);

    const handleParameterChange = useMemo(() => (
        (parameterId: string, value: number) => {
            if (selectedKey !== null) {
                dispatch(setKeyParameter({
                    keyNumber: selectedKey,
                    parameter: parameterId as any,
                    value
                }));
            }
        }
    ), [dispatch, selectedKey]);

    // Calculate consistent height based on number of parameters
    const totalParameterHeight = parameters.length * 96;

    // Get dynamic shadow styles based on press state
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
                {parameters.map(param => (
                    <ParameterControl
                        key={param.id}
                        parameter={param}
                        value={parameterValues[param.id] ?? param.defaultValue}
                        onChange={(value) => handleParameterChange(param.id, value)}
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