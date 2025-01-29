// src/features/player/components/clips/ClipContent.tsx

import React from 'react';
import { NoteVisualizer } from './NoteVisualizer';
import type { Clip } from '../../types';

interface ClipContentProps {
    clip: Clip;
}

export const ClipContent: React.FC<ClipContentProps> = ({ clip }) => {
    console.log('ClipContent render:', {
        clipId: clip.id,
        noteCount: clip.notes.length
    });

    return (
        <div className="relative w-full h-full">
            {/* Background */}
            <div className="absolute inset-0 bg-[#e8e4dc] opacity-50" />

            {/* Notes layer */}
            <div className="absolute inset-0" style={{ pointerEvents: 'all' }}>
                <NoteVisualizer
                    notes={clip.notes}
                    clipId={clip.id}
                    clipLength={clip.length}
                />
            </div>
        </div>
    );
};

export default ClipContent;