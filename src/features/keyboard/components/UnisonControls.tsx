import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { 
  setKeyParameter, 
  selectSelectedKey, 
  selectParameterContext,
  KeyParameters
} from '../store/slices/keyboard.slice';

const UnisonControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedKey = useAppSelector(selectSelectedKey);
  
  // Get the current track color for consistent styling
  const currentTrack = useAppSelector(state => state.player.currentTrack);
  const tracks = useAppSelector(state => state.player.tracks);
  const currentTrackColor = tracks[currentTrack]?.color;
  
  // Use local state for smoother slider movement
  const [localUnisonCount, setLocalUnisonCount] = useState(1);
  const [localUnisonDetune, setLocalUnisonDetune] = useState(10);
  const [localUnisonWidth, setLocalUnisonWidth] = useState(50);
  
  // Get unison parameters from Redux
  const unisonCount = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.unisonCount?.value || 1
      : 1
  );
  
  const unisonDetune = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.unisonDetune?.value || 10
      : 10
  );
  
  const unisonWidth = useAppSelector(state => 
    selectedKey !== null 
      ? state.keyboard.keyParameters[selectedKey]?.unisonWidth?.value || 50
      : 50
  );
  
  // Sync local state with Redux state
  useEffect(() => {
    setLocalUnisonCount(unisonCount);
    setLocalUnisonDetune(unisonDetune);
    setLocalUnisonWidth(unisonWidth);
  }, [unisonCount, unisonDetune, unisonWidth]);
  
  // Handler for unison parameters with debouncing
  const handleUnisonChange = (parameter: string, value: number, localSetter: React.Dispatch<React.SetStateAction<number>>) => {
    // Update local state immediately for smooth UI
    localSetter(value);
    
    // Debounce the Redux update
    if (selectedKey !== null) {
      dispatch(setKeyParameter({
        keyNumber: selectedKey,
        parameter: parameter as keyof KeyParameters,
        value
      }));
    }
  };
  
  return (
    <div className="mt-6">
      {/* Unison Count */}
      <div className="parameter-control mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Voices</span>
          <span className="text-sm font-medium text-gray-700">{localUnisonCount}</span>
        </div>
        <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
          boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
        }}>
          <input
            type="range"
            min="1"
            max="8"
            step="1"
            value={localUnisonCount}
            onChange={(e) => handleUnisonChange('unisonCount', parseInt(e.target.value), setLocalUnisonCount)}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute h-full rounded-full"
            style={{
              width: `${(localUnisonCount - 1) / 7 * 100}%`,
              backgroundColor: currentTrackColor || '#6366f1',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              opacity: 0.8,
              transition: 'all 100ms ease-out'
            }}
          />
        </div>
      </div>
      
      {/* Unison Detune */}
      <div className="parameter-control mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Detune</span>
          <span className="text-sm font-medium text-gray-700">{localUnisonDetune} cents</span>
        </div>
        <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
          boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
        }}>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={localUnisonDetune}
            onChange={(e) => handleUnisonChange('unisonDetune', parseInt(e.target.value), setLocalUnisonDetune)}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute h-full rounded-full"
            style={{
              width: `${localUnisonDetune}%`,
              backgroundColor: currentTrackColor || '#6366f1',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              opacity: localUnisonCount > 1 ? 0.8 : 0.4,
              transition: 'all 100ms ease-out'
            }}
          />
        </div>
      </div>
      
      {/* Unison Width */}
      <div className="parameter-control mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-gray-500">Width</span>
          <span className="text-sm font-medium text-gray-700">{localUnisonWidth}%</span>
        </div>
        <div className="relative h-2 bg-[#e5e9ec] rounded-full" style={{
          boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
        }}>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={localUnisonWidth}
            onChange={(e) => handleUnisonChange('unisonWidth', parseInt(e.target.value), setLocalUnisonWidth)}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute h-full rounded-full"
            style={{
              width: `${localUnisonWidth}%`,
              backgroundColor: currentTrackColor || '#6366f1',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              opacity: localUnisonCount > 1 ? 0.8 : 0.4,
              transition: 'all 100ms ease-out'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UnisonControls;
