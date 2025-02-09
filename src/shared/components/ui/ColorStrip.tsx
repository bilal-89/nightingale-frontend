// src/shared/components/ui/ColorStrip.tsx
import React from 'react';
import { NoteColor } from '../../../features/player/store/slices/arrangement/types';

interface ColorStripProps {
    selectedColor: NoteColor;
    onColorSelect: (color: NoteColor) => void;
}

export const ColorStrip: React.FC<ColorStripProps> = ({ selectedColor, onColorSelect }) => {
    return (
        <div className="flex gap-1 p-2 rounded-lg" style={{
            background: '#e8e4dc',
            boxShadow: `
                1px 1px 2px #d1cdc4,
                -1px -1px 2px #ffffff,
                inset 0.5px 0.5px 1px rgba(255, 255, 255, 0.3)
            `
        }}>
            {Object.values(NoteColor).map((color) => (
                <button
                    key={color}
                    onClick={() => onColorSelect(color)}
                    className={`w-6 h-6 rounded-md transition-all ${
                        selectedColor === color ? 'scale-110' : 'hover:scale-105'
                    }`}
                    style={{
                        backgroundColor: color,
                        boxShadow: selectedColor === color
                            ? 'inset 1px 1px 2px rgba(0, 0, 0, 0.1), inset -0.5px -0.5px 1px rgba(255, 255, 255, 0.2)'
                            : '1px 1px 2px rgba(0, 0, 0, 0.05), -0.5px -0.5px 1px rgba(255, 255, 255, 0.2)'
                    }}
                />
            ))}
        </div>
    );
};