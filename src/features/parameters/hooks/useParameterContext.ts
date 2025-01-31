import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectSelectedNote } from '../../player/state/slices/player.slice';
import { ParameterContext } from '../types/types';

export const useParameterContext = () => {
    const [activeContext, setActiveContext] = useState<ParameterContext>('keyboard');

    const selectedNote = useAppSelector(selectSelectedNote);
    const activeNotes = useAppSelector(state => state.keyboard.activeNotes);
    const keyboardState = useAppSelector(state => state.keyboard);

    // Add debug effect to track state changes
    useEffect(() => {
        console.log('State update:', {
            context: activeContext,
            hasSelectedNote: !!selectedNote,
            activeNotes,
            keyboard: keyboardState
        });
    }, [activeContext, selectedNote, activeNotes, keyboardState]);

    // Handle switching to note context
    useEffect(() => {
        if (selectedNote) {
            console.log('Switching to note context');
            setActiveContext('note');
        }
    }, [selectedNote]);

    // Handle switching to keyboard context
    useEffect(() => {
        if (activeNotes.length > 0) {
            console.log('Switching to keyboard context');
            setActiveContext('keyboard');
        }
    }, [activeNotes]);

    return activeContext;
};