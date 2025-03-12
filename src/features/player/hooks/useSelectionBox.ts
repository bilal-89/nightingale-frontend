import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './useStore';
import { selectNote } from '../store/player';
import { selectTracks } from '../store/player';

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

    const [selectionBox, setSelectionBox] = useState<{
        startPoint: Point;
        currentPoint: Point;
    } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [shiftKey, setShiftKey] = useState(false);

    const gridRef = useRef<HTMLDivElement | null>(null);
    const selectedNotesRef = useRef<Set<string>>(new Set());

    // Handle the start of a selection
    const handleSelectionStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Don't start selection if clicking on a note or not left-clicking
        if (e.button !== 0 || (e.target as HTMLElement).closest('[data-note-id]')) {
            return;
        }

        // Ensure we capture the event
        e.preventDefault();
        e.stopPropagation();
        
        const grid = gridRef.current;
        if (!grid) return;

        // Find the grid area element (the actual timeline part, not including headers)
        const gridArea = grid.querySelector('.relative.flex-grow');
        if (!gridArea) return;

        // Get accurate grid area position relative to viewport
        const rect = gridArea.getBoundingClientRect();
        
        // Calculate the exact mouse position relative to the grid area
        const exactStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Initialize selection box with start point
        setSelectionBox({
            startPoint: exactStart,
            currentPoint: exactStart
        });
        
        setShiftKey(e.shiftKey);
        setIsSelecting(true);

        // If not holding shift, clear the current selection
        if (!e.shiftKey) {
            dispatch(selectNote({ trackId: '', noteId: '' }));
            selectedNotesRef.current.clear();
        }
    }, [dispatch]);

    // Update selection while mouse is moving
    useEffect(() => {
        if (!isSelecting || !selectionBox) return;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            const grid = gridRef.current;
            if (!grid) return;

            // Find the grid area element
            const gridArea = grid.querySelector('.relative.flex-grow');
            if (!gridArea) return;

            // Get current grid area position
            const rect = gridArea.getBoundingClientRect();

            // Calculate precise current point relative to grid area
            const currentPoint = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            // Update selection box with new current point
            setSelectionBox({
                startPoint: selectionBox.startPoint,
                currentPoint
            });

            // Calculate the selection box dimensions for note intersection testing
            const left = Math.min(selectionBox.startPoint.x, currentPoint.x);
            const top = Math.min(selectionBox.startPoint.y, currentPoint.y);
            const width = Math.abs(currentPoint.x - selectionBox.startPoint.x);
            const height = Math.abs(currentPoint.y - selectionBox.startPoint.y);

            // Only attempt to select notes if the box has some minimum size
            if (width > 3 && height > 3) {
                // Get all note elements in the grid
                const noteElements = grid.querySelectorAll('[data-note-id]');
                const notesToSelect: {trackId: string, noteId: string}[] = [];

                // Precisely check each note element for intersection with selection box
                noteElements.forEach(noteEl => {
                    const noteRect = noteEl.getBoundingClientRect();
                    const gridAreaRect = gridArea.getBoundingClientRect();

                    // Calculate note position relative to grid area
                    const noteBox = {
                        left: noteRect.left - gridAreaRect.left,
                        top: noteRect.top - gridAreaRect.top,
                        width: noteRect.width,
                        height: noteRect.height
                    };

                    // Check for intersection with precise math
                    const intersects = !(
                        noteBox.left > left + width ||
                        noteBox.left + noteBox.width < left ||
                        noteBox.top > top + height ||
                        noteBox.top + noteBox.height < top
                    );

                    if (intersects) {
                        const noteId = noteEl.getAttribute('data-note-id') || '';
                        const trackId = noteEl.getAttribute('data-track-id') || '';

                        if (noteId && trackId) {
                            notesToSelect.push({ trackId, noteId });
                        }
                    }
                });

                // If we have notes to select and we're not in shift mode, clear the selection first
                if (!shiftKey && notesToSelect.length > 0) {
                    dispatch(selectNote({ trackId: '', noteId: '' }));
                    selectedNotesRef.current.clear();
                }

                // Select all notes that intersect
                notesToSelect.forEach(({ trackId, noteId }) => {
                    // Only select if not already selected
                    if (!selectedNotesRef.current.has(noteId)) {
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

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            
            // Always clear the selection box when mouse is released
            setSelectionBox(null);
            setIsSelecting(false);
        };

        // Add event listeners to window to ensure we catch all mouse events
        window.addEventListener('mousemove', handleMouseMove, { capture: true });
        window.addEventListener('mouseup', handleMouseUp, { capture: true });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove, { capture: true });
            window.removeEventListener('mouseup', handleMouseUp, { capture: true });
        };
    }, [isSelecting, selectionBox, dispatch, shiftKey]);

    return {
        selectionBox,
        handleSelectionStart,
        gridRef,
        isSelecting
    };
};