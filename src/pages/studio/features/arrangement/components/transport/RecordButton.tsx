import React from 'react';

interface RecordButtonProps {
    isRecording: boolean;
    onClick: () => void;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onClick }) => {
    return (
        <button
            onClick={onClick}
            title={isRecording ? "Stop Recording" : "Start Recording"}
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
            {/* Record button SVG */}
            <svg
                width="32"
                height="32"
                viewBox="0 0 80 79"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: isRecording
                        ? 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.2))'
                        : 'drop-shadow(1px 1px 2px rgba(209, 205, 196, 0.8))',
                    transform: isRecording ? 'translateY(1px)' : 'none',
                    transition: 'transform 0.1s ease, filter 0.1s ease',
                    userSelect: 'none' // Prevent selection
                }}
            >
                <g filter="url(#filter0_i_record)">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M39.5 0C17.6848 0 0 17.6848 0 39.5C0 61.3152 17.6848 79 39.5 79H40.5C62.3152 79 80 61.3152 80 39.5C80 17.6848 62.3153 0 40.5 0H39.5ZM9 41.8422C9 39.9516 9.17805 38.0652 9.53181 36.208L9.59307 35.8864C10.5196 31.0224 12.5103 26.4234 15.4226 22.4189L17.6861 19.3067C18.5606 18.1042 19.5313 16.9748 20.5887 15.9295C25.7281 10.8492 32.7095 8 39.9361 8C45.7217 8 51.3982 9.81445 56.0986 13.1879L58.3724 14.8199C61.7564 17.2486 64.6191 20.3313 66.7912 23.8856C68.257 26.2842 69.3975 28.8913 70.1698 31.5941C71.3705 35.7968 71.6914 40.2629 71.1009 44.5937C70.7038 47.5053 69.9026 50.3656 68.7248 53.0577L68.5835 53.3805C67.5321 55.7838 66.1798 58.0439 64.5592 60.1065L64.3983 60.3113C62.4783 62.7549 60.1825 64.8783 57.5967 66.6022C54.2351 68.8433 50.4472 70.3666 46.4699 71.0768L42.186 71.8418C39.7437 72.2779 37.2482 72.3293 34.79 71.9941C30.041 71.3465 25.5983 69.2794 22.0441 66.0637L17 61.5L14.9537 59.0445C13.0002 56.7002 11.48 54.0267 10.4644 51.1492C9.4952 48.4031 9 45.5121 9 42.6V41.8422Z"
                        fill="url(#record_gradient)"
                    />
                </g>
                <defs>
                    <filter id="filter0_i_record" x="0" y="0" width="80" height="80" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="1"/>
                        <feGaussianBlur stdDeviation="2"/>
                        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0.0470588 0 0 0 0 0.0470588 0 0 0 0 0.0509804 0 0 0 0.05 0"/>
                        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_record"/>
                    </filter>
                    <linearGradient id="record_gradient" x1="40" y1="0" x2="40" y2="79" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F5D3D3"/>
                        <stop offset="1" stopColor="#F4BEC6" stopOpacity="0.8"/>
                    </linearGradient>
                </defs>
            </svg>
        </button>
    );
};