import { useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { 
  Waveform,
  selectEditableWaveform, 
  selectIsGlobalOscillatorMode, 
  selectIsIndependentParameterMode,
  selectSelectedKey,
  selectGlobalHarmonics,
  setHarmonicAmplitude,
  setHarmonics
} from '../../keyboard/store/slices/keyboard.slice';

/**
 * Hook for accessing and updating harmonic values based on the current context.
 * Handles different configuration modes (global/local, shared/independent)
 */
export const useHarmonicValues = () => {
  const dispatch = useAppDispatch();
  const editableWaveform = useAppSelector(selectEditableWaveform);
  const isGlobalMode = useAppSelector(selectIsGlobalOscillatorMode);
  const isIndependentMode = useAppSelector(selectIsIndependentParameterMode);
  const selectedKey = useAppSelector(selectSelectedKey);
  const globalHarmonics = useAppSelector(selectGlobalHarmonics);
  const keyParameters = useAppSelector(state => state.keyboard.keyParameters);
  
  /**
   * Get the harmonics that should be displayed/edited based on current context
   */
  const harmonicValues = useMemo(() => {
    // Default values for sine wave
    const defaultValues = [100, 0, 0, 0, 0, 0, 0, 0];
    
    // If no editable waveform is selected, return defaults
    if (!editableWaveform) {
      return defaultValues;
    }
    
    // In global mode, use global harmonics
    if (isGlobalMode) {
      return globalHarmonics[editableWaveform]?.amplitudes || defaultValues;
    }
    
    // In local mode with a selected key
    if (selectedKey !== null) {
      const keyParams = keyParameters[selectedKey];
      
      // Check for per-oscillator harmonics if in independent mode
      if (isIndependentMode && keyParams?.oscillatorHarmonics?.[editableWaveform]) {
        return keyParams.oscillatorHarmonics[editableWaveform].amplitudes;
      }
      
      // Check for shared harmonics for this key
      if (keyParams?.harmonics) {
        return keyParams.harmonics.amplitudes;
      }
      
      // Fallback to global harmonics
      return globalHarmonics[editableWaveform]?.amplitudes || defaultValues;
    }
    
    // Fallback to global harmonics
    return globalHarmonics[editableWaveform]?.amplitudes || defaultValues;
  }, [
    editableWaveform,
    isGlobalMode,
    isIndependentMode,
    selectedKey,
    globalHarmonics,
    keyParameters
  ]);
  
  /**
   * Update a single harmonic amplitude
   */
  const updateHarmonicAmplitude = useCallback((harmonicIndex: number, value: number) => {
    if (!editableWaveform) return;
    
    dispatch(setHarmonicAmplitude({
      waveform: editableWaveform,
      harmonicIndex,
      value,
      keyNumber: isGlobalMode ? undefined : (selectedKey ?? undefined)
    }));
  }, [dispatch, editableWaveform, isGlobalMode, selectedKey]);
  
  /**
   * Update all harmonics at once
   */
  const updateHarmonics = useCallback((harmonics: number[]) => {
    if (!editableWaveform) return;
    
    dispatch(setHarmonics({
      waveform: editableWaveform,
      harmonics,
      keyNumber: isGlobalMode ? undefined : (selectedKey ?? undefined)
    }));
  }, [dispatch, editableWaveform, isGlobalMode, selectedKey]);
  
  /**
   * Reset harmonics to the default for the current waveform
   */
  const resetToDefault = useCallback(() => {
    if (!editableWaveform) return;
    
    // Get default harmonic values for this waveform type
    let defaultHarmonics: number[];
    switch (editableWaveform) {
      case 'sine':
        defaultHarmonics = [100, 0, 0, 0, 0, 0, 0, 0];
        break;
      case 'square':
        defaultHarmonics = [100, 0, 33, 0, 20, 0, 14, 0];
        break;
      case 'triangle':
        defaultHarmonics = [100, 0, 11, 0, 4, 0, 2, 0];
        break;
      case 'sawtooth':
        defaultHarmonics = [100, 50, 33, 25, 20, 17, 14, 12];
        break;
      default:
        defaultHarmonics = [100, 0, 0, 0, 0, 0, 0, 0];
    }
    
    updateHarmonics(defaultHarmonics);
  }, [editableWaveform, updateHarmonics]);
  
  return {
    harmonicValues,
    updateHarmonicAmplitude,
    updateHarmonics,
    resetToDefault,
    editableWaveform
  };
}; 