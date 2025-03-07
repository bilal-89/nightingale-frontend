import React from 'react';
import { useAppSelector, useAppDispatch } from '../../player/hooks';
import { 
  selectSelectedKey, 
  selectKeyWaveform, 
  selectGlobalWaveform, 
  setKeyWaveform,
  setSelectedKey,
  Waveform
} from '../store/slices/keyboard.slice';
import WaveformControls from './WaveformControls';

/**
 * Component that shows waveform selection for keys
 * Displays a message asking user to select a key if none is selected
 */
const KeyProgrammer: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector(selectSelectedKey);
  const globalWaveform = useAppSelector(selectGlobalWaveform);
  
  // Get the waveform for the selected key
  const currentWaveform = useAppSelector(state => 
    selectedKey !== null 
      ? selectKeyWaveform(state, selectedKey) 
      : globalWaveform
  );

  // Handle when the waveform is changed
  const handleWaveformChange = (waveform: Waveform) => {
    if (selectedKey !== null) {
      dispatch(setKeyWaveform({ keyNumber: selectedKey, waveform }));
    }
  };
  
  // When no key is selected, show a message
  if (selectedKey === null) {
    return (
      <div className="key-programmer p-4 bg-gray-100 rounded-lg text-center">
        <h2 className="text-xl font-bold mb-3">Key Programmer</h2>
        <p className="text-gray-600 mb-4">
          Select a key on the keyboard to customize its waveform.
        </p>
        <p className="text-sm text-gray-500">
          Each key can have its own waveform, separate from the global setting.
        </p>
      </div>
    );
  }

  return (
    <div className="key-programmer p-4 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Key {selectedKey} Settings</h2>
        <button 
          className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          onClick={() => dispatch(setSelectedKey(null))}
        >
          Close
        </button>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Waveform</h3>
        <WaveformControls 
          currentWaveform={currentWaveform}
          onWaveformChange={handleWaveformChange}
        />
      </div>
      
      <div className="text-sm text-gray-500 mt-4">
        <p>Using custom waveform: {currentWaveform}</p>
        <p>Global waveform: {globalWaveform}</p>
      </div>
    </div>
  );
};

export default KeyProgrammer; 