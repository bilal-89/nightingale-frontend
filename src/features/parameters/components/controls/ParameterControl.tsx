import React, { useCallback } from 'react';
import { Parameter } from '../../types/types';

// Define our component's props with TypeScript
interface ParameterControlProps {
    parameter: Parameter;
    value: number;
    onChange: (value: number) => void;
    showExtraControls?: boolean;
}

/**
 * A component that provides a consistent interface for parameter control.
 * Handles both linear and logarithmic parameter scaling, providing appropriate
 * visual feedback and precise control over parameter values.
 */
const ParameterControl: React.FC<ParameterControlProps> = ({
                                                               parameter,
                                                               value,
                                                               onChange,
                                                               showExtraControls
                                                           }) => {
    /**
     * Converts a parameter value to its slider representation.
     * For frequency controls, this converts from Hz to a logarithmic scale.
     */
    const getSliderValue = useCallback((param: Parameter, val: number) => {
        // Special handling for frequency parameters that need logarithmic scaling
        if (param.id === 'filterCutoff') {
            return Math.round(
                ((Math.log(val) - Math.log(param.min)) /
                    (Math.log(param.max) - Math.log(param.min))) * 100
            );
        }
        return val;
    }, []);

    /**
     * Converts a slider value back to its actual parameter value.
     * For frequency controls, this converts from logarithmic scale back to Hz.
     */
    const getFrequencyValue = useCallback((param: Parameter, val: number) => {
        if (param.id === 'filterCutoff') {
            const minLog = Math.log(param.min);
            const maxLog = Math.log(param.max);
            return Math.round(Math.exp(minLog + (val / 100) * (maxLog - minLog)));
        }
        return val;
    }, []);

    /**
     * Handles changes from the slider input, converting values as needed.
     */
    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        onChange(parameter.id === 'filterCutoff'
            ? getFrequencyValue(parameter, newValue)
            : newValue
        );
    }, [parameter, onChange, getFrequencyValue]);

    /**
     * Calculates the visual progress width for the slider background.
     * This provides immediate visual feedback about the parameter's current value.
     */
    const getProgressWidth = useCallback(() => {
        const displayValue = getSliderValue(parameter, value);
        const min = parameter.id === 'filterCutoff' ? 0 : parameter.min;
        const max = parameter.id === 'filterCutoff' ? 100 : parameter.max;
        return `${((displayValue - min) / (max - min)) * 100}%`;
    }, [parameter, value, getSliderValue]);

    return (
        <div className="p-4 rounded-2xl bg-[#e5e9ec]"
             style={{
                 boxShadow: 'inset 4px 4px 8px #c8ccd0, inset -4px -4px 8px #ffffff'
             }}>
            {/* Parameter header with label and value display */}
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                    {parameter.name}
                </label>
                <div className="flex items-center gap-2">
                    {/* Optional fine control buttons */}
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
                    {/* Value display with units */}
                    <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">
                        {value}{parameter.unit}
                    </span>
                </div>
            </div>

            {/* Slider control with visual feedback */}
            <div className="relative h-2 bg-[#e5e9ec] rounded-full mb-2"
                 style={{
                     boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
                 }}>
                {/* Actual range input */}
                <input
                    type="range"
                    min={parameter.id === 'filterCutoff' ? 0 : parameter.min}
                    max={parameter.id === 'filterCutoff' ? 100 : parameter.max}
                    step={parameter.id === 'filterCutoff' ? 1 : parameter.step}
                    value={getSliderValue(parameter, value)}
                    onChange={handleSliderChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                />
                {/* Visual progress indicator */}
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

export default ParameterControl;