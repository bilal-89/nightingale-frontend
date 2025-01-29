// src/features/player/hooks/useClipDrag.ts

import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from './useStore';
import { moveClip } from '../state/slices/player.slice';
import { selectTimelineSettings } from '../state/slices/player.slice';
import { LAYOUT } from '../constants';
import { Clip } from "../types";
import { quantizeTime } from "../utils/time.utils";

// Define the structure for storing the initial state of a drag operation
interface DragState {
    initialX: number;        // Starting X coordinate of the mouse
    initialY: number;        // Starting Y coordinate of the mouse
    initialClipTime: number; // Initial time position of the clip
    initialClipTrack: number; // Initial track number of the clip
}

// Define the structure of our timeline settings
interface TimelineSettings {
    zoom: number;           // Controls the pixels-per-millisecond ratio
    snap: {
        enabled: boolean;   // Whether snapping is active
        resolution: number; // Time between snap points
        strength: number;   // How strongly to snap (0-1)
    };
}

export function useClipDrag() {
    // Set up our Redux connection and local state
    const dispatch = useAppDispatch();
    const timelineSettings = useAppSelector(selectTimelineSettings) as TimelineSettings;
    const [dragState, setDragState] = useState<DragState | null>(null);

    // Handle the start of a drag operation
    const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>, clip: Clip) => {
        // Prevent unwanted browser behaviors
        e.stopPropagation();
        e.preventDefault();

        // Ensure we have a valid starting time
        const initialTime = typeof clip.startTime === 'number' ? clip.startTime : 0;

        console.log('Starting drag operation:', {
            mousePosition: { x: e.clientX, y: e.clientY },
            clipInfo: {
                id: clip.id,
                startTime: initialTime,
                track: clip.track
            }
        });

        // Store the initial state of our drag operation
        setDragState({
            initialX: e.clientX,
            initialY: e.clientY,
            initialClipTime: initialTime,
            initialClipTrack: clip.track
        });
    }, []);

    // Handle the continuous drag movement
    const handleDrag = useCallback((e: MouseEvent, clip: Clip) => {
        // Safety check - make sure we have drag state
        if (!dragState) {
            console.log('Attempted drag without drag state');
            return;
        }

        // Calculate how far we've moved from the start position
        const deltaX = e.clientX - dragState.initialX;
        const deltaY = e.clientY - dragState.initialY;

        // Ensure we have a valid zoom level to prevent division by zero
        const zoom = Math.max(0.001, timelineSettings.zoom);

        // Convert pixel movement to time movement
        const timeDelta = deltaX / zoom;
        const newTime = dragState.initialClipTime + timeDelta;

        // Calculate new track position based on vertical movement
        const trackDelta = Math.round(deltaY / LAYOUT.TRACK_HEIGHT);
        const newTrack = Math.max(0, Math.min(3, dragState.initialClipTrack + trackDelta));

        // Log the movement calculations for debugging
        console.log('Drag movement calculations:', {
            delta: { x: deltaX, y: deltaY },
            time: {
                delta: timeDelta,
                new: newTime
            },
            track: {
                delta: trackDelta,
                new: newTrack
            }
        });

        // Apply snapping if enabled
        let finalTime = Math.max(0, newTime); // Ensure we don't go negative
        if (timelineSettings.snap.enabled) {
            finalTime = quantizeTime(finalTime, timelineSettings.snap);
        }

        // Dispatch the move action to update the clip's position
        dispatch(moveClip({
            id: clip.id,
            position: {
                time: finalTime,
                track: newTrack
            }
        }));
    }, [dragState, timelineSettings, dispatch]);

    // Handle the end of a drag operation
    const handleDragEnd = useCallback(() => {
        console.log('Ending drag operation');
        setDragState(null);
    }, []);

    // Handle keyboard-based movement
    const handleKeyboardMove = useCallback((clip: Clip, direction: 'left' | 'right', isCoarse: boolean) => {
        // Calculate the movement amount based on zoom level
        const FINE_MOVEMENT = 1 / timelineSettings.zoom;  // One pixel worth of movement
        const COARSE_MOVEMENT = FINE_MOVEMENT * 10;      // Larger movements with shift

        // Determine the movement delta based on direction and movement size
        const delta = (direction === 'left' ? -1 : 1) * (isCoarse ? COARSE_MOVEMENT : FINE_MOVEMENT);

        // Calculate the new position
        const newTime = Math.max(0, clip.startTime + delta);

        // Apply snapping if enabled
        const finalTime = timelineSettings.snap.enabled
            ? quantizeTime(newTime, timelineSettings.snap)
            : newTime;

        console.log('Keyboard movement:', {
            direction,
            movement: isCoarse ? 'coarse' : 'fine',
            delta,
            newTime: finalTime
        });

        // Update the clip position
        dispatch(moveClip({
            id: clip.id,
            position: {
                time: finalTime,
                track: clip.track
            }
        }));
    }, [timelineSettings, dispatch]);

    // Return our drag handling functions and state
    return {
        handleDragStart,
        handleDrag,
        handleDragEnd,
        handleKeyboardMove,
        isDragging: !!dragState
    };
}