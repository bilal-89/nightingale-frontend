import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './useStore';
import { selectNote } from '../store/player';
import { selectTracks } from '../store/player/selectors/tracks';

interface Point {
    x: number;
    y: number;
}

interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
}

export const useSelectionBox = () => {
    const dispatch = useAppDispatch();
    const tracks = useAppSelector(selectTracks);

    const [selectionBox, setSelectionBox] = useState<Box | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [shiftKey, setShiftKey] = useState(false);

    const gridRef = useRef<HTMLDivElement | null>(null);
    const selectedNotesRef = useRef<Set<string>>(new Set());

    // Handle the start of a selection
    const handleSelectionStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Don't start selection if clicking on a note or not left-clicking
        if (e.button !== 0 || (e.target as HTMLElement).closest('[data-note-id]')) {
            return;
        }

        const grid = gridRef.current;
        if (!grid) return;

        // Get grid's position relative to viewport
        const rect = grid.getBoundingClientRect();

        // Calculate start point
        const start = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        console.log('Selection started at:', start);

        setStartPoint(start);
        setShiftKey(e.shiftKey);
        setIsSelecting(true);

        // If not holding shift, clear the current selection
        if (!e.shiftKey) {
            dispatch(selectNote({ trackId: '', noteId: '' }));
            selectedNotesRef.current.clear();
        }

        e.preventDefault();
    }, [dispatch]);

    // Update selection while mouse is moving
    useEffect(() => {
        if (!isSelecting || !startPoint) return;

        const handleMouseMove = (e: MouseEvent) => {
            const grid = gridRef.current;
            if (!grid) return;

            // Get grid's position
            const rect = grid.getBoundingClientRect();

            // Calculate current point
            const current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            // Calculate the selection box
            const box = {
                left: Math.min(startPoint.x, current.x),
                top: Math.min(startPoint.y, current.y),
                width: Math.abs(current.x - startPoint.x),
                height: Math.abs(current.y - startPoint.y)
            };

            // Only update if the box has a minimum size
            if (box.width > 3 && box.height > 3) {
                setSelectionBox(box);

                // Get all note elements in the DOM
                const noteElements = grid.querySelectorAll('[data-note-id]');
                const notesToSelect: {trackId: string, noteId: string}[] = [];

                // Debug info
                console.log(`Found ${noteElements.length} notes in DOM. Selection box:`, box);

                // Check each note element for intersection with selection box
                noteElements.forEach(noteEl => {
                    const noteRect = noteEl.getBoundingClientRect();

                    // Calculate position relative to grid
                    const noteBox = {
                        left: noteRect.left - rect.left,
                        top: noteRect.top - rect.top,
                        width: noteRect.width,
                        height: noteRect.height
                    };

                    // Check for intersection
                    const intersects = !(
                        noteBox.left > box.left + box.width ||
                        noteBox.left + noteBox.width < box.left ||
                        noteBox.top > box.top + box.height ||
                        noteBox.top + noteBox.height < box.top
                    );

                    if (intersects) {
                        const noteId = noteEl.getAttribute('data-note-id') || '';
                        const trackId = noteEl.getAttribute('data-track-id') || '';

                        if (noteId && trackId) {
                            notesToSelect.push({ trackId, noteId });
                            console.log(`Note intersects: ${noteId} (track: ${trackId})`);
                        }
                    }
                });

                console.log(`Found ${notesToSelect.length} notes intersecting with selection box`);

                // If we have notes to select and we're not in shift mode, clear the selection first
                if (!shiftKey && notesToSelect.length > 0) {
                    dispatch(selectNote({ trackId: '', noteId: '' }));
                    selectedNotesRef.current.clear();
                }

                // Select all notes that intersect
                notesToSelect.forEach(({ trackId, noteId }) => {
                    // Only select if not already selected
                    if (!selectedNotesRef.current.has(noteId)) {
                        console.log(`Selecting note: ${noteId}`);
                        dispatch(selectNote({
                            trackId,
                            noteId,
                            isMultiSelect: true
                        }));
                        selectedNotesRef.current.add(noteId);
                    }
                });
            }
        };

        const handleMouseUp = () => {
            console.log('Selection ended');
            setIsSelecting(false);
            setSelectionBox(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isSelecting, startPoint, dispatch, shiftKey]);

    return {
        selectionBox,
        handleSelectionStart,
        gridRef
    };
};