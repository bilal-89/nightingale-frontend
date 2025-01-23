import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    setLoopRegion,
    clearLoopRegion,
    selectLoopRegion,
    selectCurrentTime,
} from '../store/slices/arrangement/arrangement.slice';

const LoopControls: React.FC = () => {
    const dispatch = useAppDispatch();
    const loopRegion = useAppSelector(selectLoopRegion);
    const currentTime = useAppSelector(selectCurrentTime);

    const handleSetStart = () => {
        const start = currentTime;
        const end = loopRegion?.end || start + 2; // Default 2 second loop
        if (start < end) {
            dispatch(setLoopRegion({ start, end }));
        }
    };

    const handleSetEnd = () => {
        if (!loopRegion) return;
        const end = currentTime;
        if (end > loopRegion.start) {
            dispatch(setLoopRegion({ ...loopRegion, end }));
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                className={`px-3 py-1 rounded-lg text-sm transition-all duration-300
          ${loopRegion ? 'bg-blue-500 text-white' : 'bg-[#e8e4dc] text-gray-700'}`}
                onClick={() => loopRegion ? dispatch(clearLoopRegion()) : handleSetStart()}
                style={{
                    boxShadow: loopRegion
                        ? 'inset 2px 2px 4px #2a4a7f, inset -2px -2px 4px #6495ed'
                        : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                }}
            >
                {loopRegion ? 'Clear Loop' : 'Set Loop Start'}
            </button>

            {loopRegion && (
                <button
                    className="px-3 py-1 rounded-lg text-sm bg-[#e8e4dc] text-gray-700
            transition-all duration-300"
                    onClick={handleSetEnd}
                    style={{
                        boxShadow: '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                    }}
                >
                    Set Loop End
                </button>
            )}

            {loopRegion && (
                <div className="text-sm text-gray-600">
                    {loopRegion.start.toFixed(2)}s - {loopRegion.end.toFixed(2)}s
                </div>
            )}
        </div>
    );
};

export default LoopControls;