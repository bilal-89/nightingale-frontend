// src/features/player/components/inspector/NoteInspector.tsx

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { ParameterControls } from './ParameterControls';
import { useAppSelector } from '../../hooks';
import { selectSelectedNote } from '../../state/slices/player.slice';

const noteNameFromMidi = (midi: number) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
};

export const NoteInspector: React.FC = () => {
    const selectedNote = useAppSelector(selectSelectedNote);

    // Add logging to track note updates
    useEffect(() => {
        if (selectedNote) {
            console.log('Selected note updated:', {
                note: selectedNote.note,
                tuning: selectedNote.note.tuning,
                clipId: selectedNote.clipId,
                noteIndex: selectedNote.noteIndex
            });
        }
    }, [selectedNote]);

    if (!selectedNote) {
        return (
            <Card className="w-full bg-[#e8e4dc]">
                <CardHeader>
                    <CardTitle>Note Inspector</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">Select a note to edit its parameters</p>
                </CardContent>
            </Card>
        );
    }

    // Log every render with the current note data
    console.log('Rendering NoteInspector with:', {
        note: selectedNote.note,
        tuning: selectedNote.note.tuning,
        clipId: selectedNote.clipId,
        noteIndex: selectedNote.noteIndex
    });

    return (
        <Card className="w-full bg-[#e8e4dc]">
            <CardHeader>
                <CardTitle>
                    Note: {noteNameFromMidi(selectedNote.note.pitch)}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ParameterControls
                    note={selectedNote.note}
                    clipId={selectedNote.clipId}
                    noteIndex={selectedNote.noteIndex}
                />
            </CardContent>
        </Card>
    );
};