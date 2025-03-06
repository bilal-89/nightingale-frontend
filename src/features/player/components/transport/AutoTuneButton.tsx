import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { selectMultiSelectedNotes, selectSelectedNote } from '../../store/player/selectors';
import { autoTuneSelectedNotes } from '../../store/player/slice';

const TUNING_SYSTEMS = [
    { value: 'equal', label: 'ET' }
    // Future tuning systems can be added here:
    // { value: 'just', label: 'Just Intonation' },
    // { value: 'pythagorean', label: 'Pythagorean' },
    // { value: 'meantone', label: 'Quarter-comma Meantone' },
];

export const AutoTuneButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useAppDispatch();
    const selectedNote = useAppSelector(selectSelectedNote);
    const multiSelectedNotes = useAppSelector(selectMultiSelectedNotes);

    const hasSelection = selectedNote || multiSelectedNotes.length > 0;

    const handleAutoTune = (system: string) => {
        dispatch(autoTuneSelectedNotes({ system }));
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block">
            {/* SVG Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={!hasSelection}
                title="Auto-tune selected notes"
                className={`focus:outline-none transition-all duration-300 ${!hasSelection ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                style={{
                    filter: isOpen
                        ? 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.2))'
                        : 'drop-shadow(1px 1px 2px rgba(209, 205, 196, 0.8))',
                    transform: isOpen ? 'translateY(1px)' : 'none',
                    background: 'none',
                    border: 'none',
                    padding: 0
                }}
            >
                <svg width="32" height="32" viewBox="0 0 80 79" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g filter="url(#filter0_i_127_12)">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M0 39.5C0 17.6848 17.6848 0 39.5 0H40.5C62.3153 0 80 17.6848 80 39.5C80 61.3152 62.3152 79 40.5 79H39.5C17.6848 79 0 61.3152 0 39.5ZM15.0649 50.3368C15.0649 46.5722 18.137 43.5311 21.9013 43.5693L58.2987 43.938C61.7571 43.9731 64.6123 46.6513 64.8683 50.1004C64.9126 50.6974 64.8762 51.2977 64.7599 51.8849L64.2931 54.2441C63.3568 58.975 61.0227 63.3392 57.617 66.7538C53.0048 71.378 46.6808 74 40.1497 74C33.7451 74 27.4939 71.4628 22.8794 67.0215C19.1751 63.4561 16.6077 58.7957 15.6096 53.7522L15.1937 51.6506C15.1081 51.2179 15.0649 50.7779 15.0649 50.3368ZM21.3819 37.4307C17.6175 37.4689 14.5455 34.4278 14.5455 30.6632C14.5455 30.2221 14.5886 29.7821 14.6742 29.3494L15.0901 27.2478C16.0882 22.2043 18.6557 17.5439 22.36 13.9785C26.9744 9.53717 33.2256 7 39.6302 7C46.1613 7 52.4853 9.62201 57.0975 14.2462C60.5032 17.6608 62.8373 22.025 63.7736 26.7559L64.2405 29.1151C64.3567 29.7023 64.3931 30.3026 64.3488 30.8996C64.0929 34.3487 61.2377 37.0269 57.7793 37.062L21.3819 37.4307Z"
                            fill="url(#paint0_linear_127_12)"
                        />
                    </g>
                    <defs>
                        <filter id="filter0_i_127_12" x="0" y="0" width="80" height="80" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                            <feOffset dy="1"/>
                            <feGaussianBlur stdDeviation="2"/>
                            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                            <feColorMatrix type="matrix" values="0 0 0 0 0.0470588 0 0 0 0 0.0470588 0 0 0 0 0.0509804 0 0 0 0.05 0"/>
                            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_127_12"/>
                        </filter>
                        <linearGradient id="paint0_linear_127_12" x1="40" y1="0" x2="40" y2="79" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#EEE3D6"/>
                            <stop offset="1" stopColor="#DFD3C5" stopOpacity="0.6"/>
                        </linearGradient>
                    </defs>
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[100px]">
                    {TUNING_SYSTEMS.map(({ value, label }) => (
                        <button
                            key={value}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                            onClick={() => handleAutoTune(value)}
                            title={`Auto-tune using ${label}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};