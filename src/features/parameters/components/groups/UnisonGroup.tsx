// src/features/parameters/components/groups/UnisonGroup.tsx
import React from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { selectSelectedNote } from '../../../player/store/player';
import { useParameters } from '../../../player/hooks/useParameters';
import { unisonParameters } from '../../constants/unisonParameters';

interface UnisonGroupProps {
  context: 'keyboard' | 'note';
  values: Record<string, { value: number; isMixed?: boolean }>;
  onParameterChange: (parameterId: string, value: number) => void;
  currentTrackColor?: string;
}

const UnisonGroup: React.FC<UnisonGroupProps> = ({
  context,
  values,
  onParameterChange,
  currentTrackColor
}) => {
  // Filter parameters to get only unison parameters for the current context
  const filteredParams = unisonParameters.filter(
    param => param.contexts.includes(context)
  );

  return (
    <div className="parameter-group mb-6">
      {/*<h3 className="text-sm font-medium text-gray-700 mb-3">Unison</h3>*/}
      <div className="space-y-4">
        {filteredParams.map(param => (
          <div key={param.id} className="parameter-control">
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-gray-500">
                {param.name}
              </span>
              <span className="text-xs font-medium text-gray-700">
                {values[param.id]?.isMixed
                  ? '---'
                  : `${values[param.id]?.value || param.defaultValue}${param.unit || ''}`}
              </span>
            </div>
            <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
              boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
            }}>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={values[param.id]?.value ?? param.defaultValue}
                onChange={(e) => onParameterChange(param.id, parseFloat(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute h-full rounded-full"
                style={{
                  width: `${((values[param.id]?.value ?? param.defaultValue) - param.min) / (param.max - param.min) * 100}%`,
                  backgroundColor: currentTrackColor || '#6366f1',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                  opacity: values[param.id]?.isMixed ? 0.5 : 0.8,
                  transition: 'background-color 300ms ease-in-out, opacity 300ms ease-in-out'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnisonGroup;