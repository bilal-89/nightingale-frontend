// src/features/player/components/transport/TimeDisplay.tsx

import React from 'react';

interface TimeDisplayProps {
    currentTime: number;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({ currentTime }) => {
    // Convert seconds to minutes:seconds.milliseconds format
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    };

    return (
        <div className="px-4 py-2 rounded-lg bg-[#e8e4dc] font-mono text-sm">
            {formatTime(currentTime)}
        </div>
    );
};