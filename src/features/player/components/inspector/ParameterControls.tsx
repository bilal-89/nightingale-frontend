// src/features/player/components/inspector/ParameterControls.tsx

import React from 'react';
import { useParameters } from '../../hooks/useParameters';
import { NoteEvent } from '../../types';
import { ParameterDefinition } from '../../parameters/types';

interface ParameterControlProps {
    definition: ParameterDefinition;
    value: number;
    onChange: (value: number) => void;
}

const ParameterControl: React.FC<ParameterControlProps> = ({ definition, value, onChange }) => {
    const { range, display, name } = definition;

    return (
        <div className="p-4 rounded-2xl bg-[#e5e9ec]"
             style={{
                 boxShadow: 'inset 4px 4px 8px #c8ccd0, inset -4px -4px 8px #ffffff'
             }}>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                    {name}
                </label>
                <span className="text-sm text-gray-600 tabular-nums">
                    {value.toFixed(display.precision)}{display.unit || ''}
                </span>
            </div>

            <div className="relative h-2 bg-[#e5e9ec] rounded-full mb-2"
                 style={{
                     boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
                 }}>
                <input
                    type="range"
                    min={range.min * display.scale}
                    max={range.max * display.scale}
                    step={range.step * display.scale}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute h-full bg-blue-500 rounded-full"
                     style={{
                         width: `${((value / display.scale - range.min) / (range.max - range.min)) * 100}%`,
                         boxShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                     }}
                />
            </div>
        </div>
    );
};

interface ParameterControlsProps {
    note: NoteEvent;
    trackId: string;
    noteId: string;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
                                                                        note,
                                                                        trackId,
                                                                        noteId
                                                                    }) => {
    const { parameterService, handleParameterChange } = useParameters();
    const parameters = parameterService.getAllParameters();

    console.log('Rendering ParameterControls:', {
        note,
        trackId,
        noteId,
        parameters
    });

    return (
        <div className="space-y-4 p-4 bg-[#e5e9ec] rounded-3xl"
             style={{
                 boxShadow: '4px 4px 10px #c8ccd0, -4px -4px 10px #ffffff'
             }}>
            {parameters.map(definition => {
                const value = parameterService.getValue(note, definition.id);
                console.log(`Parameter ${definition.id}:`, { value, definition });

                if (!value) return null;

                return (
                    <ParameterControl
                        key={definition.id}
                        definition={definition}
                        value={value.display}
                        onChange={(displayValue) => {
                            console.log(`Parameter change ${definition.id}:`, {
                                from: value.display,
                                to: displayValue,
                                trackId,
                                noteId
                            });
                            handleParameterChange(
                                trackId,
                                noteId,
                                definition.id,
                                displayValue
                            );
                        }}
                    />
                );
            })}
        </div>
    );
};