import React from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { 
  setKeyParameter, 
  selectSelectedKey, 
  selectParameterContext,
  KeyParameters
} from '../store/slices/keyboard.slice';

const EnvelopeControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector(selectSelectedKey);
  const parameterContext = useAppSelector(selectParameterContext);
  
  // Get envelope parameters for the selected key
  const attack = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.attack?.value || 50
      : 50
  );
  
  const decay = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.decay?.value || 100
      : 100
  );
  
  const sustain = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.sustain?.value || 70
      : 70
  );
  
  const release = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.release?.value || 150
      : 150
  );
  
  // Handler for envelope parameters
  const handleEnvelopeChange = (parameter: string, value: number) => {
    if (selectedKey !== null && parameterContext === 'keyboard') {
      dispatch(setKeyParameter({
        keyNumber: selectedKey,
        parameter: parameter as keyof KeyParameters,
        value
      }));
    }
  };
  
  // Only show envelope controls when a key is selected in keyboard context
  if (selectedKey === null || parameterContext !== 'keyboard') {
    return null;
  }
  
  return (
    <div className="p-4 rounded-2xl bg-[#e5e9ec]" style={{
      boxShadow: 'inset 4px 4px 8px #c8ccd0, inset -4px -4px 8px #ffffff'
    }}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Envelope</h3>
      
      <div className="space-y-4">
        {/* Attack */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Attack</label>
            <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">{attack} ms</span>
          </div>
          <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
            boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
          }}>
            <input
              type="range"
              min="0"
              max="500"
              step="1"
              value={attack}
              onChange={(e) => handleEnvelopeChange('attack', parseInt(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute h-full rounded-full"
              style={{
                width: `${attack / 500 * 100}%`,
                backgroundColor: '#6366f1',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                transition: 'width 300ms ease-in-out'
              }}
            />
          </div>
        </div>
        
        {/* Decay */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Decay</label>
            <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">{decay} ms</span>
          </div>
          <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
            boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
          }}>
            <input
              type="range"
              min="0"
              max="1000"
              step="1"
              value={decay}
              onChange={(e) => handleEnvelopeChange('decay', parseInt(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute h-full rounded-full"
              style={{
                width: `${decay / 1000 * 100}%`,
                backgroundColor: '#6366f1',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                transition: 'width 300ms ease-in-out'
              }}
            />
          </div>
        </div>
        
        {/* Sustain */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Sustain</label>
            <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">{sustain}%</span>
          </div>
          <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
            boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
          }}>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sustain}
              onChange={(e) => handleEnvelopeChange('sustain', parseInt(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute h-full rounded-full"
              style={{
                width: `${sustain}%`,
                backgroundColor: '#6366f1',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                transition: 'width 300ms ease-in-out'
              }}
            />
          </div>
        </div>
        
        {/* Release */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Release</label>
            <span className="text-sm text-gray-600 tabular-nums min-w-[3rem] text-right">{release} ms</span>
          </div>
          <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
            boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
          }}>
            <input
              type="range"
              min="0"
              max="2000"
              step="1"
              value={release}
              onChange={(e) => handleEnvelopeChange('release', parseInt(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute h-full rounded-full"
              style={{
                width: `${release / 2000 * 100}%`,
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

export default EnvelopeControls; 