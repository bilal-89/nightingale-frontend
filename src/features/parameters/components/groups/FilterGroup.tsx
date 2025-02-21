// src/features/parameters/components/groups/FilterGroup.tsx

import React from 'react';
import { ParameterContext } from '../../types/types';
import ParameterControl from '../controls/ParameterControl';
import { parameters } from '../../constants/parameters';

interface FilterGroupProps {
    context: ParameterContext;
    values: Record<string, { value: number; isMixed?: boolean }>;
    onParameterChange: (parameterId: string, value: number) => void;
    currentTrackColor?: string;
}

const FilterGroup: React.FC<FilterGroupProps> = ({
                                                     context,
                                                     values,
                                                     onParameterChange,
                                                     currentTrackColor
                                                 }) => {
    const filterParameters = parameters.filter(
        param => param.group === 'filter' && param.contexts.includes(context)
    );

    return (
        <div className="space-y-4">
            {filterParameters.map(param => (
                <ParameterControl
                    key={param.id}
                    parameter={param}
                    value={values[param.id]?.value ?? param.defaultValue}
                    onChange={(value) => onParameterChange(param.id, value)}
                    currentTrackColor={currentTrackColor}
                    // Only show extra controls in note mode AND if parameter has extraControls enabled
                    showExtraControls={context === 'note' && param.extraControls}
                />
            ))}
        </div>
    );
};

export default FilterGroup;