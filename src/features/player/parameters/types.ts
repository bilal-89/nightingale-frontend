// src/features/player/parameters/arrangement.types.ts

export interface ParameterDefinition {
    id: string;
    name: string;
    group: 'envelope' | 'note' | 'synthesis';
    range: {
        min: number;
        max: number;
        step: number;
        defaultValue: number;
    };
    display: {
        unit?: string;
        scale: number;     // For conversion between internal and display values
        precision: number; // Number of decimal places to show
    };
}

export interface ParameterValue {
    internal: number;      // 0-1 normalized value
    display: number;       // Scaled value for UI
}

export interface ParameterUpdate {
    clipId: string;
    noteIndex: number;
    parameterId: string;
    value: number;
}