import React from 'react';

interface SkipBackButtonProps {
    onClick: () => void;
}

export const SkipBackButton: React.FC<SkipBackButtonProps> = ({ onClick }) => {
    // We don't need isPlaying state since this button doesn't have different states
    return (
        <button
            onClick={onClick}
            title="Rewind to start"
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
            {/* SkipBack button SVG */}
            <svg
                width="32"
                height="32"
                viewBox="0 0 100 90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: 'drop-shadow(1px 1px 2px rgba(209, 205, 196, 0.8))',
                    transition: 'transform 0.1s ease, filter 0.1s ease',
                    userSelect: 'none' // Prevent selection
                }}
                onMouseDown={(e) => {
                    // Add pressed effect on mouse down
                    e.currentTarget.style.filter = 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.2))';
                    e.currentTarget.style.transform = 'translateY(1px)';
                }}
                onMouseUp={(e) => {
                    // Remove pressed effect on mouse up
                    e.currentTarget.style.filter = 'drop-shadow(1px 1px 2px rgba(209, 205, 196, 0.8))';
                    e.currentTarget.style.transform = 'none';
                }}
                onMouseLeave={(e) => {
                    // Remove pressed effect when mouse leaves
                    e.currentTarget.style.filter = 'drop-shadow(1px 1px 2px rgba(209, 205, 196, 0.8))';
                    e.currentTarget.style.transform = 'none';
                }}
            >
                <path
                    opacity="0.9"
                    d="M52.738 82.8695C58.7339 86.0933 66 81.7503 66 74.9426V16.0021C66 8.98347 58.3233 4.66586 52.3255 8.31122L4.32555 37.4852C1.63968 39.1177 -3.57628e-06 42.0331 -3.57628e-06 45.1761V49.1349C-3.57628e-06 52.4478 1.82009 55.4929 4.73801 57.0617L52.738 82.8695Z"
                    fill="url(#skipback_gradient_1)"
                />
                <path
                    opacity="0.9"
                    d="M90.5 80C95.4706 80 99.5 75.9706 99.5 71V17.5C99.5 12.5294 95.4706 8.5 90.5 8.5H88.5C83.5294 8.5 79.5 12.5294 79.5 17.5V71C79.5 75.9706 83.5294 80 88.5 80H90.5Z"
                    fill="url(#skipback_gradient_2)"
                />

                <defs>
                    <linearGradient id="skipback_gradient_1" x1="33" y1="6" x2="33" y2="87" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#EEE3D6"/>
                        <stop offset="1" stopColor="#DFD3C5" stopOpacity="0.6"/>
                    </linearGradient>
                    <linearGradient id="skipback_gradient_2" x1="89.5" y1="8.5" x2="89.5" y2="80" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#EEE3D6"/>
                        <stop offset="1" stopColor="#DFD3C5" stopOpacity="0.6"/>
                    </linearGradient>
                </defs>
            </svg>
        </button>
    );
};