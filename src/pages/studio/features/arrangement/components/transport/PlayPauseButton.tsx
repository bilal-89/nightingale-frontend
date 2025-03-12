import React from 'react';

interface PlayPauseButtonProps {
    isPlaying: boolean;
    onClick: () => void;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({ isPlaying, onClick }) => {
    return (
        <button
            onClick={onClick}
            title={isPlaying ? "Stop" : "Play"}
            className="focus:outline-none"
            style={{
                background: 'none',
                border: 'none',
                padding: 0,
                position: 'relative',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent' // Prevent tap highlight color on mobile
            }}
        >
            {/* Play button SVG */}
            <svg
                width="32"
                height="32"
                viewBox="0 0 66 90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: isPlaying
                        ? 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.2))'
                        : 'drop-shadow(1px 1px 2px rgba(209, 205, 196, 0.8))',
                    transform: isPlaying ? 'translateY(1px)' : 'none',
                    transition: 'transform 0.1s ease, filter 0.1s ease',
                    userSelect: 'none' // Prevent selection
                }}
            >
                <path
                    opacity="0.9"
                    d="M13.262 82.8695C7.26608 86.0933 0 81.7503 0 74.9426L0 16.0021C0 8.98347 7.67675 4.66586 13.6745 8.31122L61.6745 37.4852C64.3603 39.1177 66 42.0331 66 45.1761V49.1348C66 52.4478 64.1799 55.4929 61.262 57.0617L13.262 82.8695Z"
                    fill="url(#play_gradient)"
                />

                <defs>
                    <linearGradient id="play_gradient" x1="33" y1="6" x2="33" y2="87" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#EEE3D6"/>
                        <stop offset="1" stopColor="#DFD3C5" stopOpacity="0.6"/>
                    </linearGradient>
                </defs>
            </svg>
        </button>
    );
};