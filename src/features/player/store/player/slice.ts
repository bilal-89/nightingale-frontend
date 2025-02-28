//src/features/player/store/player/slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlayerState, Track } from './types';
import { NoteEvent } from '../../types';
import { NoteColor } from '../../../../shared/constants/colors';

// Extend PlayerState to include playback properties
interface ExtendedPlayerState extends PlayerState {
    multiSelectedNoteIds: string[];  // Add this field
    playback: {
        isPlaying: boolean;
        currentTime: number;
        schedulingConfig: {
            scheduleAheadTime: number;
            schedulerInterval: number;
        };
        metronomeEnabled: boolean;
        countInEnabled: boolean;
        prerollBars: number;
    };
    quantizeValue?: number; // Add this line
}

const initialState: ExtendedPlayerState = {
    isRecording: false,
    recordingStartTime: null,
    recordingBuffer: [],
    currentTrack: 0,
    tracks: [
        {
            id: 'track-1',
            name: 'Track 1',
            notes: [],
            color: NoteColor.Green,  // Replace '#9fc102'
            isMuted: false,
            isSolo: false
        },
        {
            id: 'track-2',
            name: 'Track 2',
            notes: [],
            color: NoteColor.Orange,
            isMuted: false,
            isSolo: false
        },
        {
            id: 'track-3',
            name: 'Track 3',
            notes: [],
            color: NoteColor.Purple,
            isMuted: false,
            isSolo: false
        }
    ],
    multiSelectedNoteIds: [],  // Add this field
    selectedNoteId: null,
    selectedTrackId: null,
    tempo: 120,
    timelineZoom: 0.05,
    snapEnabled: true,
    snapResolution: 250,
    snapStrength: 1.0,
    // Add playback state
    playback: {
        isPlaying: false,
        currentTime: 0,
        schedulingConfig: {
            scheduleAheadTime: 0.1,
            schedulerInterval: 25
        },
        metronomeEnabled: false,
        countInEnabled: false,
        prerollBars: 1
    },
    quantizeValue: 16, // Default to 16th notes
};

export const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        // Existing player reducers
        startRecording: (state) => {
            state.isRecording = true;
            state.recordingStartTime = Date.now();
        },
        stopRecording: (state) => {
            state.isRecording = false;
            state.recordingStartTime = null;
        },
        addNoteEvent: (state, action: PayloadAction<NoteEvent>) => {
            if (state.isRecording && state.recordingStartTime) {
                state.recordingBuffer.push({
                    ...action.payload,
                    timestamp: Date.now() - state.recordingStartTime, // Keep using relative timestamp
                    duration: 0,
                    isActive: true
                });
            }
        },
        addNoteToTrack: (state, action: PayloadAction<{
            trackId: string;
            note: NoteEvent;
        }>) => {
            const track = state.tracks.find(t => t.id === action.payload.trackId);
            if (track) {
                // Add track color to note when adding to track
                track.notes.push({
                    ...action.payload.note,
                    color: track.color  // Add this line
                });
                track.notes.sort((a, b) => a.timestamp - b.timestamp);
            }
        },
        // Add color sync to moveNote
        moveNote: (state, action: PayloadAction<{
            trackId: string;
            noteId: string;
            newTime: number;
            newTrackId?: string;
        }>) => {
            const { trackId, noteId, newTime, newTrackId } = action.payload;
            const sourceTrack = state.tracks.find(t => t.id === trackId);
            if (!sourceTrack) return;

            const noteIndex = sourceTrack.notes.findIndex(n => n.id === noteId);
            if (noteIndex === -1) return;

            const note = sourceTrack.notes[noteIndex];

            if (newTrackId && newTrackId !== trackId) {
                const targetTrack = state.tracks.find(t => t.id === newTrackId);
                if (targetTrack) {
                    sourceTrack.notes.splice(noteIndex, 1);
                    targetTrack.notes.push({
                        ...note,
                        timestamp: newTime,
                        color: targetTrack.color  // Add this line
                    });
                    targetTrack.notes.sort((a, b) => a.timestamp - b.timestamp);
                }
            } else {
                sourceTrack.notes[noteIndex] = {
                    ...note,
                    timestamp: newTime
                };
                sourceTrack.notes.sort((a, b) => a.timestamp - b.timestamp);
            }
        },
        updateNoteEvent: (state, action: PayloadAction<{
            id: string;
            duration: number;
        }>) => {
            const noteIndex = state.recordingBuffer.findIndex(
                note => note.id === action.payload.id
            );
            if (noteIndex !== -1) {
                state.recordingBuffer[noteIndex] = {
                    ...state.recordingBuffer[noteIndex],
                    duration: action.payload.duration,
                    isActive: false
                };
            }
        },
        // Add new action for moving multiple notes
        moveNotes: (state, action: PayloadAction<{
            notes: Array<{
                trackId: string;
                noteId: string;
                newTime: number;
                newTrackId?: string;
            }>;
        }>) => {
            action.payload.notes.forEach(({ trackId, noteId, newTime, newTrackId }) => {
                const sourceTrack = state.tracks.find(t => t.id === trackId);
                if (!sourceTrack) return;

                const noteIndex = sourceTrack.notes.findIndex(n => n.id === noteId);
                if (noteIndex === -1) return;

                const note = sourceTrack.notes[noteIndex];

                if (newTrackId && newTrackId !== trackId) {
                    const targetTrack = state.tracks.find(t => t.id === newTrackId);
                    if (targetTrack) {
                        sourceTrack.notes.splice(noteIndex, 1);
                        targetTrack.notes.push({
                            ...note,
                            timestamp: newTime
                        });
                        targetTrack.notes.sort((a, b) => a.timestamp - b.timestamp);
                    }
                } else {
                    sourceTrack.notes[noteIndex] = {
                        ...note,
                        timestamp: newTime
                    };
                    sourceTrack.notes.sort((a, b) => a.timestamp - b.timestamp);
                }
            });
        },

// Add new action for updating parameters of multiple notes
        updateMultipleNoteParameters: (state, action: PayloadAction<{
            updates: Array<{
                trackId: string;
                noteId: string;
                updates: Partial<NoteEvent>;
            }>;
        }>) => {
            action.payload.updates.forEach(({ trackId, noteId, updates }) => {
                const track = state.tracks.find(t => t.id === trackId);
                if (!track) return;

                const noteIndex = track.notes.findIndex(n => n.id === noteId);
                if (noteIndex === -1) return;

                track.notes[noteIndex] = {
                    ...track.notes[noteIndex],
                    ...updates
                };
            });
        },
        updateNoteParameters: (state, action: PayloadAction<{
            trackId: string;
            noteId: string;
            updates: Partial<NoteEvent>;
        }>) => {
            const { trackId, noteId, updates } = action.payload;
            console.log('Updating note parameters:', { trackId, noteId, updates });
            
            // Find the track and note
            const track = state.tracks.find(t => t.id === trackId);
            if (!track) return;
            
            const noteIndex = track.notes.findIndex(n => n.id === noteId);
            if (noteIndex === -1) return;
            
            // Apply updates
            if (updates.synthesis) {
                // Make sure synthesis object exists
                if (!track.notes[noteIndex].synthesis) {
                    track.notes[noteIndex].synthesis = {
                        mode: 'tunable',
                        waveform: 'sine',
                        envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
                        gain: 1,
                        effects: {}
                    };
                }
                
                // Apply envelope updates
                if (updates.synthesis.envelope) {
                    track.notes[noteIndex].synthesis.envelope = {
                        ...track.notes[noteIndex].synthesis.envelope,
                        ...updates.synthesis.envelope
                    };
                }
                
                // Apply filter updates
                if (updates.synthesis.effects?.filter) {
                    if (!track.notes[noteIndex].synthesis.effects.filter) {
                        track.notes[noteIndex].synthesis.effects.filter = {
                            type: 'lowpass',
                            frequency: 20000,
                            Q: 0.707
                        };
                    }
                    
                    track.notes[noteIndex].synthesis.effects.filter = {
                        ...track.notes[noteIndex].synthesis.effects.filter,
                        ...updates.synthesis.effects.filter
                    };
                }
                
                // Apply unison updates
                if (updates.synthesis?.unison) {
                    console.log('Applying unison updates:', updates.synthesis.unison);
                    
                    // Make sure unison object exists
                    if (!track.notes[noteIndex].synthesis.unison) {
                        track.notes[noteIndex].synthesis.unison = {
                            count: 1,
                            detune: 10,
                            width: 50
                        };
                    }
                    
                    // Apply each unison parameter
                    track.notes[noteIndex].synthesis.unison = {
                        ...track.notes[noteIndex].synthesis.unison,
                        ...updates.synthesis.unison
                    };
                    
                    console.log('Updated unison:', track.notes[noteIndex].synthesis.unison);
                }
            }
            
            // Apply other updates (velocity, tuning, etc.)
            if (updates.velocity !== undefined) {
                track.notes[noteIndex].velocity = updates.velocity;
            }
            
            if (updates.tuning !== undefined) {
                track.notes[noteIndex].tuning = updates.tuning;
            }
        },

        deleteNote: (state, action: PayloadAction<{
            trackId: string;
            noteId: string;
        }>) => {
            const track = state.tracks.find(t => t.id === action.payload.trackId);
            if (track) {
                track.notes = track.notes.filter(n => n.id !== action.payload.noteId);
            }
        },
        deleteNotes: (state, action: PayloadAction<{
            notes: Array<{
                trackId: string;
                noteId: string;
            }>;
        }>) => {
            action.payload.notes.forEach(({ trackId, noteId }) => {
                const track = state.tracks.find(t => t.id === trackId);
                if (track) {
                    track.notes = track.notes.filter(n => n.id !== noteId);
                }
            });
            // Clear selection after delete
            state.selectedNoteId = null;
            state.multiSelectedNoteIds = [];
        },

        setSelectedNoteId: (state, action: PayloadAction<string | null>) => {
            state.selectedNoteId = action.payload;
        },

        // Update the selectNote reducer
        selectNote: (state, action: PayloadAction<{
            trackId: string;
            noteId: string;
            isMultiSelect?: boolean;
        } | null>) => {
            if (!action.payload) {
                state.selectedNoteId = null;
                state.selectedTrackId = null;
                state.multiSelectedNoteIds = [];
                return;
            }

            const { trackId, noteId, isMultiSelect } = action.payload;

            if (!isMultiSelect) {
                // Single selection mode
                state.selectedNoteId = noteId;
                state.selectedTrackId = trackId;
                state.multiSelectedNoteIds = [];
            } else {
                // Multi-select mode
                if (state.selectedNoteId && state.multiSelectedNoteIds.length === 0) {
                    // If we have a single selection, move it to multi-select
                    state.multiSelectedNoteIds = [state.selectedNoteId];
                }

                // Add new note to selection if not already included
                if (!state.multiSelectedNoteIds.includes(noteId)) {
                    state.multiSelectedNoteIds.push(noteId);
                }

                state.selectedNoteId = null;
                state.selectedTrackId = trackId;
            }
        },
        clearSelection: (state) => {
            state.selectedNoteId = null;
            state.selectedTrackId = null;
            state.multiSelectedNoteIds = [];
        },
        // Optional: Add action to remove a note from multi-selection
        removeFromSelection: (state, action: PayloadAction<string>) => {
            state.multiSelectedNoteIds = state.multiSelectedNoteIds.filter(
                id => id !== action.payload
            );
        },

        commitRecordingBuffer: (state, action: PayloadAction<string>) => {
            const track = state.tracks.find(t => t.id === action.payload);
            if (track && state.recordingBuffer.length > 0) {
                track.notes.push(...state.recordingBuffer);
                track.notes.sort((a, b) => a.timestamp - b.timestamp);
                state.recordingBuffer = [];
            }
        },

        setTimelineZoom: (state, action: PayloadAction<number>) => {
            state.timelineZoom = action.payload;
        },

        setSnapSettings: (state, action: PayloadAction<{
            enabled: boolean;
            resolution?: number;
            strength?: number;
        }>) => {
            const { enabled, resolution, strength } = action.payload;
            state.snapEnabled = enabled;
            if (resolution !== undefined) state.snapResolution = resolution;
            if (strength !== undefined) state.snapStrength = strength;
        },

        setTempo: (state, action: PayloadAction<number>) => {
            state.tempo = Math.max(20, Math.min(300, action.payload));
        },

        // Update addTrack to use NoteColor
        addTrack: (state) => {
            const lastTrack = state.tracks[state.tracks.length - 1];
            const colors = Object.values(NoteColor);
            const nextColorIndex = (colors.indexOf(lastTrack.color as NoteColor) + 1) % colors.length;
            const newTrackNumber = state.tracks.length + 1;

            state.tracks.push({
                id: `track-${newTrackNumber}`,
                name: `Track ${newTrackNumber}`,
                notes: [],
                color: colors[nextColorIndex],
                isMuted: false,
                isSolo: false
            });
        },

        deleteTrack: (state, action: PayloadAction<string>) => {
            state.tracks = state.tracks.filter(track => track.id !== action.payload);
        },

        // Add color sync to setTrackSettings
        setTrackSettings: (state, action: PayloadAction<{
            trackId: string;
            updates: Partial<Track>;
        }>) => {
            const track = state.tracks.find(t => t.id === action.payload.trackId);
            if (track) {
                const oldColor = track.color;
                Object.assign(track, action.payload.updates);

                // If color changed, update all notes in the track
                if (action.payload.updates.color && action.payload.updates.color !== oldColor) {
                    track.notes = track.notes.map(note => ({
                        ...note,
                        color: action.payload.updates.color
                    }));
                }
            }
        },

        setCurrentTrack: (state, action: PayloadAction<number>) => {
            if (action.payload >= 0 && action.payload < state.tracks.length) {
                state.currentTrack = action.payload;
            }
        },

        // Integrated playback reducers
        startPlayback: (state) => {
            state.playback.isPlaying = true;
        },
        stopPlayback: (state) => {
            state.playback.isPlaying = false;
        },
        updatePlaybackPosition: (state, action: PayloadAction<number>) => {
            state.playback.currentTime = action.payload;
        },
        setPlaybackPosition: (state, action: PayloadAction<number>) => {
            state.playback.currentTime = Math.max(0, action.payload);
        },
        setTempo: (state, action: PayloadAction<number>) => {
            const newTempo = Math.max(20, Math.min(300, action.payload));
            state.tempo = newTempo;
        },
        updateSchedulingConfig: (state, action: PayloadAction<{
            scheduleAheadTime?: number;
            schedulerInterval?: number;
        }>) => {
            state.playback.schedulingConfig = {
                ...state.playback.schedulingConfig,
                ...action.payload
            };
        },
        toggleMetronome: (state) => {
            state.playback.metronomeEnabled = !state.playback.metronomeEnabled;
        },
        toggleCountIn: (state) => {
            state.playback.countInEnabled = !state.playback.countInEnabled;
        },
        setPrerollBars: (state, action: PayloadAction<number>) => {
            state.playback.prerollBars = Math.max(0, Math.min(4, action.payload));
        },
        setQuantizeValue: (state, action: PayloadAction<number>) => {
            state.quantizeValue = action.payload;
        },
        quantizeSelectedNotes: (state, action: PayloadAction<{ division: number }>) => {
            const { division } = action.payload;
            const beatsPerMinute = state.tempo || 120;
            const secondsPerBeat = 60 / beatsPerMinute;
            const secondsPerDivision = secondsPerBeat / (division / 4);
            const millisecondsPerDivision = secondsPerDivision * 1000;
            
            const notesToQuantize: Array<{ trackId: string; noteIndex: number }> = [];
            
            // Collect notes to quantize
            state.tracks.forEach(track => {
                track.notes.forEach((note, noteIndex) => {
                    if (state.selectedNoteId === note.id || 
                        state.multiSelectedNoteIds.includes(note.id)) {
                        notesToQuantize.push({
                            trackId: track.id,
                            noteIndex
                        });
                    }
                });
            });
            
            console.log(`Quantizing ${notesToQuantize.length} notes to 1/${division}`);
            
            // Apply quantization
            notesToQuantize.forEach(({ trackId, noteIndex }) => {
                const track = state.tracks.find(t => t.id === trackId);
                if (!track) return;
                
                const note = track.notes[noteIndex];
                if (!note) return;
                
                // Find nearest grid point
                const nearestGridPoint = Math.round(note.timestamp / millisecondsPerDivision) * millisecondsPerDivision;
                
                // Update note timestamp
                note.timestamp = nearestGridPoint;
            });

            // Sort notes after quantization
            state.tracks.forEach(track => {
                track.notes.sort((a, b) => a.timestamp - b.timestamp);
            });
        },
        autoTuneSelectedNotes: (state, action: PayloadAction<{ system: string }>) => {
            const notesToTune: Array<{ trackId: string; noteIndex: number }> = [];
            
            // Collect notes to tune
            state.tracks.forEach(track => {
                track.notes.forEach((note, noteIndex) => {
                    if (state.selectedNoteId === note.id || 
                        state.multiSelectedNoteIds.includes(note.id)) {
                        notesToTune.push({
                            trackId: track.id,
                            noteIndex
                        });
                    }
                });
            });
            
            console.log(`Auto-tuning ${notesToTune.length} notes using ${action.payload.system}`);
            
            // Apply tuning based on selected system
            notesToTune.forEach(({ trackId, noteIndex }) => {
                const track = state.tracks.find(t => t.id === trackId);
                if (!track) return;
                
                const note = track.notes[noteIndex];
                if (!note) return;

                switch (action.payload.system) {
                    case 'equal':
                    default:
                        // Equal Temperament tuning
                        if (note.tuning !== undefined) {
                            const semitoneOffset = note.tuning / 100;
                            if (Math.abs(semitoneOffset) >= 0.5) {
                                note.note += Math.sign(semitoneOffset);
                            }
                            note.tuning = 0;
                        }
                        break;
                    // Future tuning systems can be added here
                }
            });
        }
    }
});

export const {
    // Export all actions
    startRecording,
    stopRecording,
    addNoteEvent,
    addNoteToTrack,
    moveNote,
    updateNoteEvent,
    startPlayback,
    stopPlayback,
    updatePlaybackPosition,
    setPlaybackPosition,
    setTempo,
    updateSchedulingConfig,
    toggleMetronome,
    toggleCountIn,
    setPrerollBars,
    updateNoteParameters,
    deleteNote,
    setSelectedNoteId,
    selectNote,
    commitRecordingBuffer,
    setTimelineZoom,
    setSnapSettings,
    addTrack,
    deleteTrack,
    setTrackSettings,
    setCurrentTrack,
    clearSelection,
    removeFromSelection,
    moveNotes,
    updateMultipleNoteParameters,
    deleteNotes,
    setQuantizeValue,
    quantizeSelectedNotes,
    autoTuneSelectedNotes

    // ... (other actions)
} = playerSlice.actions;


export default playerSlice.reducer;
