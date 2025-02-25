import { useCallback, useState, useEffect } from 'react';
import { useAppDispatch } from '../../../../hooks';
import { setCurrentTrack, deleteNotes } from '../../../../store/player';
import { selectSelectedNote, selectMultiSelectedNotes } from '../../../../store/player/selectors/selection';
import { useAppSelector } from '../../../../hooks';

export function useTrackInteraction() {
    const dispatch = useAppDispatch();
    const [pressedTrackId, setPressedTrackId] = useState<string | null>(null);
    const selectedNote = useAppSelector(selectSelectedNote);
    const multiSelectedNotes = useAppSelector(selectMultiSelectedNotes);

    const handleTrackSelect = useCallback((trackIndex: number) => {
        dispatch(setCurrentTrack(trackIndex));
    }, [dispatch]);

    const handleTrackMouseDown = useCallback((trackId: string) => {
        setPressedTrackId(trackId);
    }, []);

    const handleTrackMouseUp = useCallback((trackId: string, index: number) => {
        if (pressedTrackId === trackId) {
            handleTrackSelect(index);
        }
        setPressedTrackId(null);
    }, [pressedTrackId, handleTrackSelect]);

    const handleTrackMouseLeave = useCallback(() => {
        setPressedTrackId(null);
    }, []);

    // Add keyboard event handling for deletion
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Prevent default browser behavior
                e.preventDefault();

                if (selectedNote || multiSelectedNotes.length > 0) {
                    const notesToDelete = multiSelectedNotes.length > 0
                        ? multiSelectedNotes.map(n => ({
                            trackId: n.trackId,
                            noteId: n.note.id
                        }))
                        : selectedNote
                            ? [{
                                trackId: selectedNote.trackId,
                                noteId: selectedNote.note.id
                            }]
                            : [];

                    if (notesToDelete.length > 0) {
                        dispatch(deleteNotes({ notes: notesToDelete }));
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, selectedNote, multiSelectedNotes]);

    return {
        pressedTrackId,
        handleTrackMouseDown,
        handleTrackMouseUp,
        handleTrackMouseLeave
    };
}