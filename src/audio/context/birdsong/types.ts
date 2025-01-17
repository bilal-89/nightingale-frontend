export interface BirdsongParameters {
    syrinxTension: number;
    airPressure: number;
    turbulence: number;
}

export interface BirdsongState {
    isInitialized: boolean;
    activeNotes: number[];
    parameters: BirdsongParameters;
}

export interface BirdsongNote {
    note: number;
    velocity: number;
}

export type BirdsongAction =
    | { type: 'birdsong/initialize' }
    | { type: 'birdsong/noteOn'; payload: number }
    | { type: 'birdsong/noteOff'; payload: number }
    | { type: 'birdsong/updateParameters'; payload: BirdsongParameters };