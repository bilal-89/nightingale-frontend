import React from 'react';
import { ParameterContext } from '../../types/types';
import ParameterControl from '../controls/ParameterControl';
import { parameters } from '../../constants/parameters';

interface EnvelopeGroupProps {
    context: ParameterContext;
    values: Record<string, number>;
    onParameterChange: (parameterId: string, value: number) => void;
}

/**
 * EnvelopeGroup manages the ADSR (Attack, Decay, Sustain, Release) envelope parameters
 * for our synthesizer. The envelope shapes how the sound evolves over time, from the
 * initial key press to the final release of the note.
 *
 * Each parameter affects the sound in a specific way:
 * - Attack: How quickly the sound reaches full volume
 * - Decay: How quickly the sound falls to the sustain level
 * - Sustain: The volume level held while the key is pressed
 * - Release: How quickly the sound fades after key release
 */
const EnvelopeGroup: React.FC<EnvelopeGroupProps> = ({
                                                         context,
                                                         values,
                                                         onParameterChange
                                                     }) => {
    // Filter out just the envelope parameters from our parameter list
    const envelopeParameters = parameters.filter(
        param => param.group === 'envelope' && param.contexts.includes(context)
    );

    return (
        <div className="space-y-4">
            {/* Group header with explanatory title */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                    Envelope
                </h3>
                <div className="text-xs text-gray-500">
                    {context === 'note' ? 'Note Envelope' : 'Key Envelope'}
                </div>
            </div>

            {/* Visual envelope shape representation */}
            <div className="relative h-16 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    {/* We draw the ADSR curve using the current parameter values */}
                    <path
                        d={`
                            M 0 100
                            L ${values.attack / 10} 0
                            L ${(values.attack + values.decay) / 10} ${100 - values.sustain}
                            L ${80} ${100 - values.sustain}
                            L ${80 + values.release / 10} 100
                        `}
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="2"
                        fill="none"
                    />
                </svg>
            </div>

            {/* Parameter controls for each envelope stage */}
            <div className="grid gap-4">
                {envelopeParameters.map(param => (
                    <ParameterControl
                        key={param.id}
                        parameter={param}
                        value={values[param.id] ?? param.defaultValue}
                        onChange={(value) => onParameterChange(param.id, value)}
                        showExtraControls={context === 'note'}
                    />
                ))}
            </div>

            {/* Helpful context-specific tips */}
            <div className="mt-2 text-xs text-gray-500">
                {context === 'note' ? (
                    "Fine-tune the envelope shape for this specific note"
                ) : (
                    "Set default envelope shape for all new notes"
                )}
            </div>
        </div>
    );
};

export default EnvelopeGroup;