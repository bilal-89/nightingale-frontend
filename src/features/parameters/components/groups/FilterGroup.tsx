import React from 'react';
import { ParameterContext } from '../../types/types';
import ParameterControl from '../controls/ParameterControl';
import { parameters } from '../../constants/parameters';

interface FilterGroupProps {
    context: ParameterContext;
    values: Record<string, number>;
    onParameterChange: (parameterId: string, value: number) => void;
}

/**
 * FilterGroup manages the filter parameters that shape the timbre of the sound.
 * It provides controls for both the filter's cutoff frequency and resonance,
 * allowing users to sculpt the harmonic content of their sounds.
 *
 * The filter parameters work together to create various timbral effects:
 * - Cutoff: Determines which frequencies pass through the filter
 * - Resonance: Emphasizes frequencies around the cutoff point
 */
const FilterGroup: React.FC<FilterGroupProps> = ({
                                                     context,
                                                     values,
                                                     onParameterChange
                                                 }) => {
    // Get just the filter-related parameters
    const filterParameters = parameters.filter(
        param => param.group === 'filter' && param.contexts.includes(context)
    );

    // Calculate the filter response curve based on current parameters
    const getFilterResponse = () => {
        const cutoff = values.filterCutoff ?? 20000;
        const resonance = values.filterResonance ?? 0.707;
        const points: [number, number][] = [];

        // Generate points for the frequency response curve
        for (let i = 0; i <= 100; i++) {
            const freq = Math.exp(Math.log(20) + (i / 100) * Math.log(20000 / 20));
            const response = calculateFilterResponse(freq, cutoff, resonance);
            points.push([i, response]);
        }

        return points;
    };

    // Calculate the filter's frequency response at a given frequency
    const calculateFilterResponse = (freq: number, cutoff: number, resonance: number) => {
        const normalizedFreq = freq / cutoff;
        const response = 1 / Math.sqrt(1 + Math.pow(normalizedFreq, 4));
        const resonancePeak = resonance * Math.exp(
            -Math.pow(Math.log(normalizedFreq), 2) * 2
        );
        return Math.min(100, response * 100 + resonancePeak * 50);
    };

    return (
        <div className="space-y-4">
            {/* Group header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                    Filter
                </h3>
                <div className="text-xs text-gray-500">
                    {context === 'note' ? 'Note Filter' : 'Key Filter'}
                </div>
            </div>

            {/* Visual filter response curve */}
            <div className="relative h-32 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <path
                        d={`M ${getFilterResponse()
                            .map(([x, y]) => `${x} ${100 - y}`)
                            .join(' L ')}`}
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="2"
                        fill="none"
                    />
                </svg>

                {/* Frequency markers */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
                    <span>20Hz</span>
                    <span>1kHz</span>
                    <span>20kHz</span>
                </div>
            </div>

            {/* Filter parameter controls */}
            <div className="grid gap-4">
                {filterParameters.map(param => (
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
                    "Adjust the filter settings for this specific note"
                ) : (
                    "Set default filter characteristics for all new notes"
                )}
            </div>
        </div>
    );
};

export default FilterGroup;