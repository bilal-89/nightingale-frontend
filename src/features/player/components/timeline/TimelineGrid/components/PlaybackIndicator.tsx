// src/features/player/components/timeline/TimelineGrid/components/PlaybackIndicator.tsx

import React from 'react';

interface PlaybackIndicatorProps {
    position: number;
    isPlaying: boolean;
}

export const PlaybackIndicator: React.FC<PlaybackIndicatorProps> = ({
                                                                        position,
                                                                        isPlaying
                                                                    }) => {
    if (!isPlaying) return null;

    return (
        <div
            className="absolute top-[31px] bottom-[47px] w-px bg-stone-300 z-20 pointer-events-none transform-gpu"
            style={{
                transform: `translateX(${position}px)`,
                willChange: 'transform'
            }}
        />
    );
};