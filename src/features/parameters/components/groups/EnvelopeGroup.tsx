// src/features/parameters/components/groups/EnvelopeGroup.tsx

import React from 'react';
import { ParameterContext } from '../../types/types';
import ParameterControl from '../controls/ParameterControl';
import { parameters } from '../../constants/parameters';
// src/features/parameters/components/groups/EnvelopeGroup.tsx

interface EnvelopeGroupProps {
    context: ParameterContext;
    values: Record<string, { value: number; isMixed?: boolean }>;
    onParameterChange: (parameterId: string, value: number) => void;
    currentTrackColor?: string;
}

const EnvelopeGroup: React.FC<EnvelopeGroupProps> = ({
                                                         context,
                                                         values,
                                                         onParameterChange,
                                                         currentTrackColor
                                                     }) => {
    const envelopeParameters = parameters.filter(
        param => param.group === 'envelope' && param.contexts.includes(context)
    );

    return (
        <div className="space-y-4">
            {envelopeParameters.map(param => (
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

export default EnvelopeGroup;