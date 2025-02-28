import React from 'react';
import { useParameters } from '../../player/hooks/useParameters';

interface ParameterSliderProps {
  parameterId: string;
  trackId: string;
  noteId: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  value: number;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  parameterId,
  trackId,
  noteId,
  label,
  min,
  max,
  step,
  defaultValue,
  value
}) => {
  const { handleParameterChange } = useParameters();
  
  return (
    <div className="parameter-control mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-sm font-medium text-gray-700">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value || defaultValue}
        onChange={(e) => handleParameterChange(trackId, noteId, parameterId, parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
};

export default ParameterSlider; 