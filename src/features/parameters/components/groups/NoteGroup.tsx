import React from 'react';
import { ParameterContext } from '../../types/types';
import ParameterControl from '../controls/ParameterControl';
import { parameters } from '../../constants/parameters';

interface NoteGroupProps {
    context: ParameterContext;
    values: Record<string, number>;
    onParameterChange: (parameterId: string, value: number) => void;
}

/**
 * NoteGroup manages the fundamental properties of a note such as tuning and velocity.
 * These parameters form the foundation of how a note sounds and behaves:
 * - Tuning adjusts the pitch deviation from standard tuning in cents
 * - Velocity determines how hard the note is struck, affecting its dynamics
 * - Micro-timing (in note context) allows for subtle rhythmic adjustments
 */
const NoteGroup: React.FC<NoteGroupProps> = ({
                                                 context,
                                                 values,
                                                 onParameterChange
                                             }) => {
    // Filter parameters specific to note properties
    const noteParameters = parameters.filter(
        param => param.group === 'note' && param.contexts.includes(context)
    );

    // Helper function to generate the visual pitch representation
    const getPitchVisualization = () => {
        const tuning = values.tuning ?? 0;
        // const normalizedTuning = (tuning + 100) / 200; // Normalize to 0-1 range
        const centerPosition = 50;
        const deviation = tuning / 2; // Scale down for visual purposes

        return {
            position: `${centerPosition + deviation}%`,
            color: Math.abs(tuning) < 5
                ? 'rgb(34, 197, 94)' // Green when close to center
                : 'rgb(234, 179, 8)' // Yellow when detuned
        };
    };

    return (
        <div className="space-y-4">
            {/* Group header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                    Note Properties
                </h3>
                <div className="text-xs text-gray-500">
                    {context === 'note' ? 'Note Settings' : 'Key Settings'}
                </div>
            </div>

            {/* Tuning visualization */}
            <div className="relative h-8 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                {/* Center line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-300" />

                {/* Tuning indicator */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all"
                    style={{
                        left: getPitchVisualization().position,
                        backgroundColor: getPitchVisualization().color,
                        transform: `translate(-50%, -50%)`,
                        boxShadow: '0 0 8px currentColor'
                    }}
                />

                {/* Tuning markers */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
                    <span>-100¢</span>
                    <span>0¢</span>
                    <span>+100¢</span>
                </div>
            </div>

            {/* Note parameter controls */}
            <div className="grid gap-4">
                {noteParameters.map(param => (
                    <ParameterControl
                        key={param.id}
                        parameter={param}
                        value={values[param.id] ?? param.defaultValue}
                        onChange={(value) => onParameterChange(param.id, value)}
                        showExtraControls={context === 'note'}
                    />
                ))}
            </div>

            {/* Contextual help text */}
            <div className="mt-2 text-xs text-gray-500">
                {context === 'note' ? (
                    "Adjust the fundamental properties of this note"
                ) : (
                    "Set default note properties for this key"
                )}
            </div>

            {/* Performance tips */}
            {context === 'note' && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                        Tip: Fine-tune these parameters to add expressive variations to your notes.
                        Small tuning adjustments can create natural-sounding variations, while
                        velocity changes affect the note's dynamics.
                    </p>
                </div>
            )}
        </div>
    );
};

export default NoteGroup;