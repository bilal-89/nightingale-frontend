import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BirdsongState, BirdsongParameters } from '../../../audio/context/birdsong/types.ts';

const initialState: BirdsongState = {
    isInitialized: false,
    activeNotes: [],
    parameters: {
        syrinxTension: 0.5,
        airPressure: 0.7,
        turbulence: 0.3
    }
};

const birdsongSlice = createSlice({
    name: 'birdsong',
    initialState,
    reducers: {
        initialize: (state) => {
            state.isInitialized = true;
        },
        noteOn: (state, action: PayloadAction<number>) => {
            if (!state.activeNotes.includes(action.payload)) {
                state.activeNotes.push(action.payload);
            }
        },
        noteOff: (state, action: PayloadAction<number>) => {
            state.activeNotes = state.activeNotes.filter(note => note !== action.payload);
        },
        updateParameters: (state, action: PayloadAction<BirdsongParameters>) => {
            state.parameters = action.payload;
        }
    }
});

export const { initialize, noteOn, noteOff, updateParameters } = birdsongSlice.actions;
export default birdsongSlice.reducer;