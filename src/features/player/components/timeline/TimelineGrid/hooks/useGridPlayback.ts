// src/features/player/components/timeline/TimelineGrid/hooks/useGridPlayback.ts

import { useEffect, useRef } from 'react';
import { TimelineSettings } from '../types';

export function useGridPlayback(
    isPlaying: boolean,
    getCurrentTime: () => number,
    timelineSettings: TimelineSettings
) {
    const animationFrameRef = useRef<number | null>(null);
    const playbackPositionRef = useRef<number>(0);

    useEffect(() => {
        let lastTimestamp: number | null = null;

        const updatePlaybackPosition = (timestamp: number) => {
            if (!isPlaying) {
                lastTimestamp = null;
                return;
            }

            if (lastTimestamp === null) {
                lastTimestamp = timestamp;
            }

            // Get current time from timing service
            const currentTimeMs = getCurrentTime();

            // Convert time to pixels based on zoom level
            const pixelsPerMs = timelineSettings.zoom;
            const newPosition = currentTimeMs * pixelsPerMs;

            // Update position with smooth animation
            playbackPositionRef.current = newPosition;

            // Request next frame
            animationFrameRef.current = requestAnimationFrame(updatePlaybackPosition);
        };

        if (isPlaying) {
            animationFrameRef.current = requestAnimationFrame(updatePlaybackPosition);
        }

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, getCurrentTime, timelineSettings.zoom]);

    return playbackPositionRef;
}