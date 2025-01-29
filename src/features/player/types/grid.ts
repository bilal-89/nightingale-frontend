export interface GridPosition {
    track: number;
    cell: number;
}

export interface DragState {
    type: 'CREATE' | 'MOVE';
    startPoint: GridPosition;
    currentPoint: GridPosition;
    clipId?: string;
    originalPosition?: {
        startCell: number;
        track: number;
    };
}
