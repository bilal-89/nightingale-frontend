import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import { selectSelectedNotes } from '../store/selectors';
import { 
  setBatchParameters, 
  updateOscillatorBatch,
  KeyParameters,
  Oscillator
} from '../../keyboard/store/slices/keyboard.slice';

/**
 * Hook for working with multiple selected notes in the player
 */
export const useMultiSelection = () => {
  const dispatch = useAppDispatch();
  const selectedNotes = useAppSelector(selectSelectedNotes);
  
  /**
   * Apply a parameter change to all selected notes
   */
  const updateBatchParameter = useCallback((
    parameter: keyof KeyParameters,
    value: number
  ) => {
    if (selectedNotes.length === 0) return;
    
    // Extract just the note numbers for the action
    const noteNumbers = selectedNotes.map(note => note.note);
    
    dispatch(setBatchParameters({
      notes: noteNumbers,
      parameter,
      value
    }));
  }, [dispatch, selectedNotes]);
  
  /**
   * Update an oscillator parameter for all selected notes
   */
  const updateBatchOscillator = useCallback((
    oscillatorIndex: number,
    changes: Partial<Oscillator>
  ) => {
    if (selectedNotes.length === 0) return;
    
    // Extract just the note numbers for the action
    const noteNumbers = selectedNotes.map(note => note.note);
    
    dispatch(updateOscillatorBatch({
      notes: noteNumbers,
      oscillatorIndex,
      changes
    }));
  }, [dispatch, selectedNotes]);
  
  return {
    selectedNotes,
    updateBatchParameter,
    updateBatchOscillator,
    hasSelection: selectedNotes.length > 0
  };
};

export default useMultiSelection; 