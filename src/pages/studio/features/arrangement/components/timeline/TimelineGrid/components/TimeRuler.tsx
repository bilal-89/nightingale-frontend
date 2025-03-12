// src/features/player/components/timeline/TimelineGrid/components/TimeRuler.tsx

import React from 'react';
import { TimeRulerProps } from '../types';

export const TimeRuler: React.FC<TimeRulerProps> = ({
                                                        cellCount,
                                                        cellWidth,
                                                        formatGridTime
                                                    }) => {
    return (
        <div className="flex h-8 border-b border-[#d1cdc4]">
            {Array(cellCount).fill(null).map((_, i) => (
                <div
                    key={`time-${i}`}
                    className="flex-shrink-0 border-r border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm"
                    style={{ width: cellWidth }}
                >
                    {formatGridTime(i)}
                </div>
            ))}
        </div>
    );
};