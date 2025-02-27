import React from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { 
  setKeyParameter, 
  selectSelectedKey, 
  selectParameterContext,
  KeyParameters
} from '../store/slices/keyboard.slice';

const FilterControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector(selectSelectedKey);
  const parameterContext = useAppSelector(selectParameterContext);
  
  // Get filter parameters for the selected key
  const cutoff = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.filterCutoff?.value || 20000
      : 20000
  );
  
  const resonance = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.filterResonance?.value || 0.707
      : 0.707
  );
  
  // Handler for filter parameters
  const handleFilterChange = (parameter: string, value: number) => {
    if (selectedKey !== null && parameterContext === 'keyboard') {
      dispatch(setKeyParameter({
        keyNumber: selectedKey,
        parameter: parameter as keyof KeyParameters,
        value
      }));
    }
  };
  
  // Only show filter controls when a key is selected in keyboard context
  if (selectedKey === null || parameterContext !== 'keyboard') {
    return null;
  }
  
  // Format cutoff frequency for display
  const formatCutoff = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)} kHz`;
    }
    return `${freq} Hz`;
  };
  
  return (
    <div className="p-4 rounded-2xl bg-[#e5e9ec]" style={{
      boxShadow: 'inset 4px 4px 8px #c8ccd0, inset -4px -4px 4px #ffffff'
    }}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Filter</h3>
      
      <div className="space-y-4">
        {/* Cutoff */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Cutoff</label>
            <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">{formatCutoff(cutoff)}</span>
          </div>
          <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
            boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
          }}>
            <input
              type="range"
              min="20"
              max="20000"
              step="1"
              value={cutoff}
              onChange={(e) => handleFilterChange('filterCutoff', parseInt(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute h-full rounded-full"
              style={{
                // Use logarithmic scale for width to match human hearing
                width: `${Math.log10(cutoff / 20) / Math.log10(1000) * 100}%`,
                backgroundColor: '#6366f1',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                transition: 'width 300ms ease-in-out'
              }}
            />
          </div>
        </div>
        
        {/* Resonance */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Resonance</label>
            <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">{resonance.toFixed(2)}</span>
          </div>
          <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
            boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
          }}>
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={resonance}
              onChange={(e) => handleFilterChange('filterResonance', parseFloat(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute h-full rounded-full"
              style={{
                width: `${(resonance - 0.1) / 19.9 * 100}%`,
                backgroundColor: '#6366f1',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                transition: 'width 300ms ease-in-out'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls; 