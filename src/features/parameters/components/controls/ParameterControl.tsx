import React, { useCallback } from 'react';
import { Parameter } from '../../types/types';

interface ParameterControlProps {
    parameter: Parameter;
    value: number;
    onChange: (value: number) => void;
    showExtraControls?: boolean;
    currentTrackColor?: string;
}

const ParameterControl: React.FC<ParameterControlProps> = ({
                                                               parameter,
                                                               value,
                                                               onChange,
                                                               showExtraControls,
                                                               currentTrackColor
                                                           }) => {
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
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                    backgroundColor: currentTrackColor || '#e5e9ec',
                                    color: 'white'
                                }}
                            >
                                ←
                            </button>
                            <button
                                onClick={() => onChange(value + parameter.step)}
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                    backgroundColor: currentTrackColor || '#e5e9ec',
                                    color: 'white'
                                }}
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

            <div className="relative h-2 bg-[#e5e9ec] rounded-full"
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
                <div className="absolute h-full rounded-full"
                     style={{
                         width: `${((value - parameter.min) / (parameter.max - parameter.min)) * 100}%`,
                         backgroundColor: currentTrackColor || '#3b82f6',
                         boxShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                     }}
                />
            </div>
        </div>
    );
};

export default ParameterControl;