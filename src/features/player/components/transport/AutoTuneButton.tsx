import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useStore';
import { selectMultiSelectedNotes, selectSelectedNote } from '../../store/player/selectors';
import { autoTuneSelectedNotes } from '../../store/player/slice';

const TUNING_SYSTEMS = [
    { value: 'equal', label: 'Equal Temperament' }
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
                Auto-Tune
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 bg-white rounded-lg shadow-lg z-50">
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