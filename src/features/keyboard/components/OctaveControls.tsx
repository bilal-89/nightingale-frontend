import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import {
    incrementOctave,
    decrementOctave,
    SynthMode,
    selectMode
} from '../store/slices/keyboard.slice';

interface OctaveControlsProps {
    className?: string;
    size?: number;
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

export const OctaveControls: React.FC<OctaveControlsProps> = ({
    className = '',
    size = 2.1
}) => {
    const dispatch = useAppDispatch();
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

    // Calculate SVG dimensions based on size prop
    const svgWidth = 33 * size;
    const svgHeight = 46 * size;

    return (
        <div className={`flex flex-col ${className}`} style={{ gap: '0.1rem', marginLeft: '0px' }}>
            {/* Up/Increment Octave SVG Button */}
            <div
                className="cursor-pointer transition-all duration-100 relative"
                onMouseDown={() => setPressed(prev => ({ ...prev, up: true }))}
                onMouseUp={() => {
                    setPressed(prev => ({ ...prev, up: false }));
                    handleIncrement();
                }}
                onMouseLeave={() => setPressed(prev => ({ ...prev, up: false }))}
                style={{
                    transform: pressed.up ? 'scale(0.98) translateY(1px)' : 'scale(1)',
                    filter: pressed.up
                        ? 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.05))'
                        : 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1))',
                    marginLeft: '0px'
                }}
            >
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    viewBox="0 0 33 46"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M24.8208 10.1943L24.5204 10.8482C23.9316 12.13 24.1646 13.6396 25.1125 14.6842L26.6935 16.4265C27.6099 17.4363 27.8096 18.9062 27.1958 20.1238C26.328 21.8458 24.1718 22.4567 22.5283 21.4482C21.1089 20.5772 19.2614 20.9001 18.2231 22.2022L15.445 25.686C15.0502 26.1811 14.4536 26.4724 13.8204 26.4793C12.4001 26.4947 11.3716 25.1291 11.7787 23.7683L13.2419 18.877C13.7367 17.2229 13.0933 15.4396 11.6563 14.4824L10.3866 13.6367C8.98634 12.7041 8.78593 10.725 9.97079 9.53058C10.6943 8.80128 11.7717 8.55123 12.7424 8.88737L15.803 9.94717C17.3139 10.4704 18.9814 9.82267 19.743 8.41679L20.0674 7.81811C20.824 6.42141 22.6286 5.99558 23.9298 6.90666C24.982 7.6434 25.357 9.02709 24.8208 10.1943Z" fill="#f5f2ed"/>
                </svg>
            </div>

            {/* Down/Decrement Octave SVG Button */}
            <div
                className="cursor-pointer transition-all duration-100 relative"
                onMouseDown={() => setPressed(prev => ({ ...prev, down: true }))}
                onMouseUp={() => {
                    setPressed(prev => ({ ...prev, down: false }));
                    handleDecrement();
                }}
                onMouseLeave={() => setPressed(prev => ({ ...prev, down: false }))}
                style={{
                    transform: pressed.down ? 'scale(0.98) translateY(1px)' : 'scale(1)',
                    filter: pressed.down
                        ? 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.05))'
                        : 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1))',
                    marginLeft: '0px',
                    marginTop: '-81px'
                }}
            >
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    viewBox="0 0 33 46"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M6.31898 31.2731L13.9789 35.9191C15.3085 36.7256 15.8946 38.3508 15.3858 39.8203C14.6779 41.8649 12.2269 42.6865 10.4298 41.4815L2.98878 36.4925C1.84788 35.7275 1.34731 34.3024 1.75925 32.992C2.36171 31.0756 4.60134 30.2313 6.31898 31.2731Z" fill="#f5f2ed"/>
                </svg>
            </div>
        </div>
    );
};