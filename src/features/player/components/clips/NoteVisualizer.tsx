// src/features/player/components/clips/NoteVisualizer.tsx

import React from 'react';
import { useAppDispatch } from '../../hooks/useStore';
import { selectNote } from '../../state/slices/player.slice';
import type { NoteEvent } from '../../types';

interface NoteVisualizerProps {
    notes: NoteEvent[];
    clipId: string;
    clipLength: number;
}

export const NoteVisualizer: React.FC<NoteVisualizerProps> = ({
                                                                  notes,
                                                                  clipId,
                                                                  clipLength
                                                              }) => {
    const dispatch = useAppDispatch();

    console.log('NoteVisualizer rendered with:', { notes, clipId, clipLength }); // Debug render

    const handleNoteClick = (noteIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('Note clicked:', {
            clipId,
            noteIndex,
            note: notes[noteIndex],
            target: e.target
        });

        dispatch(selectNote({
            clipId,
            noteIndex
        }));
    };

    return (
        <div className="absolute inset-0" style={{ pointerEvents: 'all' }}>
            {notes.map((note, index) => {
                const startPosition = (note.timestamp / (clipLength * 250)) * 100;
                const width = ((note.duration || 0.1) / (clipLength * 250)) * 100;

                console.log('Rendering note:', {
                    index,
                    startPosition,
                    width,
                    note
                });

                return (
                    <div
                        key={`${note.id}-${index}`}
                        onClick={(e) => handleNoteClick(index, e)}
                        className={`absolute h-3 bg-blue-500 hover:bg-blue-600 cursor-pointer rounded-sm z-10`}
                        style={{
                            left: `${startPosition}%`,
                            width: `${width}%`,
                            opacity: Math.max(0.3, note.velocity / 127),
                        }}
                    />
                );
            })}
        </div>
    );
};