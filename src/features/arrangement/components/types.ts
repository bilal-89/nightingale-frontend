export interface Clip {
    id: string;
    startCell: number;
    length: number;  // in cells
    track: number;
    isSelected: boolean;
    parameters: {
        velocity: number;
        pitch: number;
        tuning: number;
    };
}