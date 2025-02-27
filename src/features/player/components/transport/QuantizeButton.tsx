import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { quantizeSelectedNotes } from '../../store/player';
import { selectMultiSelectedNotes, selectSelectedNote } from '../../store/player/selectors';

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
        <div className="relative">
            <button
                className={`px-3 py-2 rounded-lg transition-all duration-300 bg-[#e8e4dc]
                    ${hasSelection ? 'hover:bg-[#dcd8d0]' : 'opacity-50'}
                    ${isOpen ? 'shadow-inner' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                disabled={!hasSelection}
                style={{
                    boxShadow: isOpen 
                        ? 'inset 2px 2px 4px #d1cdc4, inset -2px -2px 4px #ffffff'
                        : '2px 2px 4px #d1cdc4, -2px -2px 4px #ffffff'
                }}
            >
                Quant
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg z-50">
                    {QUANTIZE_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            className="block w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                            onClick={() => handleQuantize(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};