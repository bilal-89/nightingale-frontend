// src/features/player/components/inspector/NoteInspector.tsx

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card';
import { ParameterControls } from './ParameterControls';
import { useAppSelector } from '../../hooks';
import { selectSelectedNote } from '../../store/player';


const noteNameFromMidi = (midi: number) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
};

export const NoteInspector: React.FC = () => {
    const selectedNote = useAppSelector(selectSelectedNote);

    useEffect(() => {
        if (selectedNote) {
            console.log('Selected note updated:', {
                note: selectedNote.note,
                trackId: selectedNote.trackId,
                tuning: selectedNote.note.tuning
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

    return (
        <Card className="w-full bg-[#e8e4dc]">
            <CardHeader>
                <CardTitle>
                    Note: {noteNameFromMidi(selectedNote.note.note)}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ParameterControls
                    note={selectedNote.note}
                    trackId={selectedNote.trackId}
                    noteId={selectedNote.note.id}
                />
            </CardContent>
        </Card>
    );
};