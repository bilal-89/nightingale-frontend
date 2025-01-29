// hooks/useTimelinePosition.ts (replacing useTimelineGrid.ts)
export function useTimelinePosition() {
    const timeService = useTimeService();
    const zoomLevel = useZoomLevel();

    const handleMousePosition = (e: MouseEvent): TimelinePosition => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pixels = e.clientX - rect.left;
        const time = timeService.pixelsToTime(pixels, zoomLevel);

        return {
            time,
            pixels,
            track: calculateTrackFromY(e.clientY - rect.top)
        };
    };

    return {
        handleMousePosition,
        // Other timeline position utilities
    };
}

// hooks/useClipDrag.ts (modified)
export function useClipDrag() {
    const timeService = useTimeService();
    const quantizeSettings = useQuantizeSettings();

    const handleDrag = (clip: Clip, delta: number) => {
        const timeDelta = timeService.pixelsToTime(delta, zoomLevel);
        const newTime = clip.startTime + timeDelta;

        // Optional quantization
        const finalTime = quantizeSettings.enabled
            ? timeService.quantizeTime(newTime, quantizeSettings)
            : newTime;

        updateClipTime(clip.id, finalTime);
    };

    // Other drag handling logic
}