import React, { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../player/hooks';
import { 
  Waveform, 
  selectSelectedKey, 
  selectKeyWaveform, 
  setKeyWaveform, 
  setGlobalWaveform
} from '../store/slices/keyboard.slice';
import WaveformControls from './WaveformControls';

/**
 * Component that allows selecting a waveform for the currently selected key
 * or the global waveform if no key is selected
 */
const KeyWaveformControl: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector(selectSelectedKey);
  
  // Get the waveform for the selected key, or global waveform if no key is selected
  const currentWaveform = useAppSelector(state => 
    selectedKey !== null 
      ? selectKeyWaveform(state, selectedKey) 
      : state.keyboard.globalWaveform
  );

  // Handler for waveform changes
  const handleWaveformChange = useCallback((waveform: Waveform) => {
    if (selectedKey !== null) {
      // Set waveform for the specific key
      dispatch(setKeyWaveform({ keyNumber: selectedKey, waveform }));
    } else {
      // Set global waveform
      dispatch(setGlobalWaveform(waveform));
    }
  }, [dispatch, selectedKey]);

  return (
    <div className="key-waveform-control">
      <h3 className="text-lg font-medium mb-2">
        {selectedKey !== null 
          ? `Waveform for Key ${selectedKey}` 
          : 'Global Waveform'}
      </h3>
      <WaveformControls 
        currentWaveform={currentWaveform}
        onWaveformChange={handleWaveformChange}
      />
    </div>
  );
};

export default KeyWaveformControl; 