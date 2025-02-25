import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { ChevronUp, ChevronDown } from 'lucide-react';
import {
    selectCurrentOctave,
    incrementOctave,
    decrementOctave,
    SynthMode,
    selectMode
} from '../store/slices/keyboard.slice';

interface OctaveControlsProps {
    className?: string;
}

interface ButtonState {
    up: boolean;
    down: boolean;
}

const modeStyles: Record<SynthMode, {
    shadow: string;
    innerShadow: string;
}> = {
    tunable: {
        shadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff',
        innerShadow: 'inset 8px 8px 16px #c8ccd0, inset -8px -8px 16px #ffffff'
    },
    drums: {
        shadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff',
        innerShadow: 'inset 8px 8px 16px #c8ccd0, inset -8px -8px 16px #ffffff'
    }
};

export const OctaveControls: React.FC<OctaveControlsProps> = ({ className = '' }) => {
    const dispatch = useAppDispatch();
    const currentOctave = useSelector(selectCurrentOctave);
    const currentMode = useSelector(selectMode);
    const [pressed, setPressed] = useState<ButtonState>({ up: false, down: false });

    const handleIncrement = useCallback(() => {
        dispatch(incrementOctave());
    }, [dispatch]);

    const handleDecrement = useCallback(() => {
        dispatch(decrementOctave());
    }, [dispatch]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'x' || e.key === 'X') {
                setPressed(prev => ({ ...prev, up: true }));
                handleIncrement();
            } else if (e.key === 'z' || e.key === 'Z') {
                setPressed(prev => ({ ...prev, down: true }));
                handleDecrement();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'x' || e.key === 'X') {
                setPressed(prev => ({ ...prev, up: false }));
            } else if (e.key === 'z' || e.key === 'Z') {
                setPressed(prev => ({ ...prev, down: false }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleIncrement, handleDecrement]);

    const currentStyle = modeStyles[currentMode];

    const getButtonStyle = (isPressed: boolean) => ({
        boxShadow: isPressed ? currentStyle.innerShadow : currentStyle.shadow,
        transform: isPressed ? 'scale(0.95)' : 'scale(1)'
    });

    return (
        <div className={`flex flex-col items-center gap-2 ${className}`}>
            <button
                onMouseDown={() => setPressed(prev => ({ ...prev, up: true }))}
                onMouseUp={() => setPressed(prev => ({ ...prev, up: false }))}
                onMouseLeave={() => setPressed(prev => ({ ...prev, up: false }))}
                onClick={handleIncrement}
                className="p-2 rounded-lg transition-all duration-100 ease-in-out
                    bg-[#e5e9ec] text-[#4a4543] hover:brightness-95"
                style={getButtonStyle(pressed.up)}
                aria-label="Increment Octave"
            >
                <ChevronUp className="w-5 h-5" />
            </button>

            <div className="text-lg font-medium text-[#4a4543] min-w-[2ch] text-center">
                {currentOctave}
            </div>

            <button
                onMouseDown={() => setPressed(prev => ({ ...prev, down: true }))}
                onMouseUp={() => setPressed(prev => ({ ...prev, down: false }))}
                onMouseLeave={() => setPressed(prev => ({ ...prev, down: false }))}
                onClick={handleDecrement}
                className="p-2 rounded-lg transition-all duration-100 ease-in-out
                    bg-[#e5e9ec] text-[#4a4543] hover:brightness-95"
                style={getButtonStyle(pressed.down)}
                aria-label="Decrement Octave"
            >
                <ChevronDown className="w-5 h-5" />
            </button>
        </div>
    );
};