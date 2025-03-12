import React from 'react';
import { useAppDispatch } from '../../../../hooks';
import { addTrack } from '../../../../../../../../features/player/store/player';
import { cn } from '../../../../../../../../core/utils/styles.utils';
import { Track } from "../../../../../../../../features/player/store/player";

interface TrackHeadersProps {
    tracks: Track[];
    currentTrackIndex: number;
    pressedTrackId: string | null;
    onTrackMouseDown: (trackId: string) => void;
    onTrackMouseUp: (trackId: string, index: number) => void;
    onTrackMouseLeave: () => void;
}

export const TrackHeaders: React.FC<TrackHeadersProps> = ({
                                                              tracks,
                                                              currentTrackIndex,
                                                              pressedTrackId,
                                                              onTrackMouseDown,
                                                              onTrackMouseUp,
                                                              onTrackMouseLeave
                                                          }) => {
    const dispatch = useAppDispatch();
    const [isAddButtonPressed, setIsAddButtonPressed] = React.useState(false);

    const handleAddTrackMouseDown = () => {
        setIsAddButtonPressed(true);
    };

    const handleAddTrackMouseUp = () => {
        setIsAddButtonPressed(false);
        dispatch(addTrack());
    };

    const handleAddTrackMouseLeave = () => {
        setIsAddButtonPressed(false);
    };

    return (
        <div className="w-32 flex-shrink-0 border-r border-[#d1cdc4]">
            {/* Time header */}
            <div className="h-8 border-b border-[#d1cdc4] bg-[#e8e4dc] px-2 py-1 text-sm font-medium">
                {/*Time*/}
            </div>

            {/* Track buttons */}
            {tracks.map((track, index) => (
                <button
                    key={track.id}
                    onMouseDown={() => onTrackMouseDown(track.id)}
                    onMouseUp={() => onTrackMouseUp(track.id, index)}
                    onMouseLeave={onTrackMouseLeave}
                    className={cn(
                        "w-full h-24 px-3 border-b border-[#d1cdc4] transition-all duration-100",
                        "flex items-center text-left",
                        (pressedTrackId === track.id || currentTrackIndex === index)
                            ? "bg-[#e8e4dc]"  // Darker beige
                            : "bg-[#f5f2ed]"  // Lighter beige
                    )}
                    style={{
                        boxShadow: currentTrackIndex === index || pressedTrackId === track.id
                            ? 'inset 2px 2px 5px #c8ccd0, inset -2px -2px 5px #ffffff'
                            : '4px 4px 10px #c8ccd0, -4px -4px 10px #ffffff',
                        transform: (currentTrackIndex === index || pressedTrackId === track.id)
                            ? 'translateY(1px)'
                            : 'translateY(0)',
                        border: (currentTrackIndex === index || pressedTrackId === track.id)
                            ? '1px solid rgba(255, 255, 255, 0.9)'
                            : '1px solid rgba(255, 255, 255, 0.7)'
                    }}
                >
                    <span className={cn(
                        "text-sm font-medium",
                        currentTrackIndex === index ? "text-gray-900" : "text-gray-600"
                    )}>
                        {/*{track.name}*/}
                    </span>
                </button>
            ))}

            {/* Add Track Button as SVG */}
            <div
                className="w-full h-12 cursor-pointer relative"
                onMouseDown={handleAddTrackMouseDown}
                onMouseUp={handleAddTrackMouseUp}
                onMouseLeave={handleAddTrackMouseLeave}
            >
                <svg
                    width="100%"
                    height="48"
                    viewBox="0 0 128 48"
                    preserveAspectRatio="none"
                    className="transition-all duration-100"
                    style={{
                        transform: isAddButtonPressed ? 'translateY(1px)' : 'translateY(0)',
                    }}
                >
                    <defs>
                        <linearGradient id="addTrackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F5F2ED" />
                            <stop offset="100%" stopColor="#E8E4DF" />
                        </linearGradient>

                        <filter id="addTrackShadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="#d1cdc4" floodOpacity="0.4" />
                            <feDropShadow dx="-2" dy="-2" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.5" />
                        </filter>

                        <filter id="addTrackInnerShadow" x="-5%" y="-5%" width="110%" height="110%">
                            <feOffset dx="1" dy="1" />
                            <feGaussianBlur stdDeviation="1" result="offset-blur" />
                            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                            <feFlood floodColor="#c8c4bb" floodOpacity="0.5" result="color" />
                            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                        </filter>
                    </defs>

                    {/* Button background */}
                    <rect
                        width="128"
                        height="48"
                        rx="4"
                        fill="url(#addTrackGradient)"
                        filter={isAddButtonPressed ? "url(#addTrackInnerShadow)" : "url(#addTrackShadow)"}
                        stroke={isAddButtonPressed ? "#d1cdc4" : "#ffffff"}
                        strokeOpacity="0.7"
                        strokeWidth="1"
                    />

                    {/* Text content */}
                    <foreignObject width="128" height="48">
                        <div
                            xmlns="http://www.w3.org/1999/xhtml"
                            className="w-full h-full flex items-center justify-center"
                        >
                            <span className="text-sm font-medium text-gray-600">
                                {/*+ Add Track*/}
                            </span>
                        </div>
                    </foreignObject>
                </svg>
            </div>
        </div>
    );
};

export default TrackHeaders;