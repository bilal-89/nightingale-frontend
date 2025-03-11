import { useCallback, useMemo, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../.././store/hooks';
import { 
  selectEditableWaveform,
  selectIsGlobalOscillatorMode, 
  selectIsIndependentParameterMode,
  selectSelectedKey,
  selectGlobalHarmonics,
  setHarmonicAmplitude,
  setHarmonics
} from '../../../../../features/keyboard/store/slices/keyboard.slice';

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
  
  // Log when critical dependencies change
  useEffect(() => {
    console.log(`[USE HARMONIC VALUES] Dependencies changed:`);
    console.log(`  - editableWaveform: ${editableWaveform}`);
    console.log(`  - isGlobalMode: ${isGlobalMode}`);
    console.log(`  - isIndependentMode: ${isIndependentMode}`);
    console.log(`  - selectedKey: ${selectedKey}`);
  }, [editableWaveform, isGlobalMode, isIndependentMode, selectedKey]);
  
  /**
   * Get the harmonics that should be displayed/edited based on current context
   */
  const harmonicValues = useMemo(() => {
    // Default values for sine wave
    const defaultValues = [100, 0, 0, 0, 0, 0, 0, 0];
    
    // If no editable waveform is selected, return defaults
    if (!editableWaveform) {
      console.log(`[USE HARMONIC VALUES] No editable waveform, using default values`);
      return defaultValues;
    }
    
    // In global mode, use global harmonics
    if (isGlobalMode) {
      const harmonics = globalHarmonics[editableWaveform]?.amplitudes || defaultValues;
      console.log(`[USE HARMONIC VALUES] Global mode, using harmonics for ${editableWaveform}:`, harmonics);
      return harmonics;
    }
    
    // In local mode with a selected key
    if (selectedKey !== null) {
      const keyParams = keyParameters[selectedKey];
      console.log(`[USE HARMONIC VALUES] Local mode, key ${selectedKey}, keyParams:`, keyParams);
      
      // Check for per-oscillator harmonics if in independent mode
      if (isIndependentMode && keyParams?.oscillatorHarmonics?.[editableWaveform]) {
        const harmonics = keyParams.oscillatorHarmonics[editableWaveform].amplitudes;
        console.log(`[USE HARMONIC VALUES] Using independent harmonics for ${editableWaveform}:`, harmonics);
        return harmonics;
      }
      
      // Check for shared harmonics for this key
      if (keyParams?.harmonics) {
        const harmonics = keyParams.harmonics.amplitudes;
        console.log(`[USE HARMONIC VALUES] Using shared key harmonics:`, harmonics);
        return harmonics;
      }
      
      // Fallback to global harmonics
      const harmonics = globalHarmonics[editableWaveform]?.amplitudes || defaultValues;
      console.log(`[USE HARMONIC VALUES] Falling back to global harmonics for ${editableWaveform}:`, harmonics);
      return harmonics;
    }
    
    // Fallback to global harmonics
    const harmonics = globalHarmonics[editableWaveform]?.amplitudes || defaultValues;
    console.log(`[USE HARMONIC VALUES] No key selected, using global harmonics for ${editableWaveform}:`, harmonics);
    return harmonics;
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