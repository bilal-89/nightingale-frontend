// services/time.service.ts (new file, replacing grid.service.ts)

export class TimeService {
    // Convert between time and pixel positions
    timeToPixels(time: number, zoomLevel: number): number {
        return time * zoomLevel / 1000; // 1 second = X pixels based on zoom
    }

    pixelsToTime(pixels: number, zoomLevel: number): number {
        return (pixels * 1000) / zoomLevel;
    }
}