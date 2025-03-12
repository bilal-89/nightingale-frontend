import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { quantizeSelectedNotes } from '../../../../../../features/player/store/player';
import { selectMultiSelectedNotes, selectSelectedNote } from '../../../../../../features/player/store/player';

const QUANTIZE_OPTIONS = [
    { value: 4, label: '1/4' },
    { value: 8, label: '1/8' },
    { value: 16, label: '1/16' },
    { value: 32, label: '1/32' }
];

export const QuantizeButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useAppDispatch();
    const selectedNote = useAppSelector(selectSelectedNote);
    const multiSelectedNotes = useAppSelector(selectMultiSelectedNotes);

    const hasSelection = selectedNote || multiSelectedNotes.length > 0;

    const handleQuantize = (division: number) => {
        dispatch(quantizeSelectedNotes({ division }));
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block">
            {/* SVG Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={!hasSelection}
                title="Quantize selected notes"
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
                <svg width="32" height="32" viewBox="0 0 72 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0 26.6446C0 27.7491 0.895429 28.6446 2 28.6446H10.9925C12.0971 28.6446 12.9925 29.54 12.9925 30.6446V40.812C12.9925 41.9166 12.0971 42.812 10.9925 42.812H2C0.895431 42.812 0 43.7074 0 44.812V53.044C0 54.1486 0.895429 55.044 2 55.044H10.9925C12.0971 55.044 12.9925 55.9394 12.9925 57.044V67.5C12.9925 68.6046 13.8879 69.5 14.9925 69.5H26.5C27.6046 69.5 28.5 68.6046 28.5 67.5V57.044C28.5 55.9394 29.3954 55.044 30.5 55.044H39C40.1046 55.044 41 55.9394 41 57.044V67.5C41 68.6046 41.8954 69.5 43 69.5H54.8421C55.9467 69.5 56.8421 68.6046 56.8421 67.5V57.044C56.8421 55.9394 57.7375 55.044 58.8421 55.044H70C71.1046 55.044 72 54.1486 72 53.044V44.812C72 43.7074 71.1046 42.812 70 42.812H58.8421C57.7375 42.812 56.8421 41.9166 56.8421 40.812V30.6446C56.8421 29.54 57.7375 28.6446 58.8421 28.6446H68.9173C70.0219 28.6446 70.9173 27.7491 70.9173 26.6446V16.456C70.9173 15.3514 70.0219 14.456 68.9173 14.456H58.8421C57.7375 14.456 56.8421 13.5606 56.8421 12.456V2C56.8421 0.895431 55.9467 0 54.8421 0H43.6842C42.5796 0 41.6842 0.895431 41.6842 2V12.456C41.6842 13.5606 40.7888 14.456 39.6842 14.456H29.609C28.5045 14.456 27.609 13.5606 27.609 12.456V2C27.609 0.895431 26.7136 0 25.609 0H14.9925C13.8879 0 12.9925 0.895431 12.9925 2V12.456C12.9925 13.5606 12.0971 14.456 10.9925 14.456H2C0.895431 14.456 0 15.3514 0 16.456V26.6446ZM28.1429 40.912C28.1429 42.0166 29.0383 42.912 30.1429 42.912H39.1429C40.2475 42.912 41.1429 42.0166 41.1429 40.912V30.912C41.1429 29.8074 40.2475 28.912 39.1429 28.912H30.1429C29.0383 28.912 28.1429 29.8074 28.1429 30.912V40.912Z"
                        fill="url(#quant_gradient)"
                    />
                    <defs>
                        <linearGradient id="quant_gradient" x1="36" y1="0" x2="36" y2="69.5" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#EEE3D6"/>
                            <stop offset="1" stopColor="#DFD3C5" stopOpacity="0.6"/>
                        </linearGradient>
                    </defs>
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg z-50 min-w-[100px]">
                    {QUANTIZE_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                            onClick={() => handleQuantize(value)}
                            title={`Quantize to ${label} notes`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};