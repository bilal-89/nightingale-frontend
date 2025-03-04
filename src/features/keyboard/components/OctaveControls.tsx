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
    size = 1.5
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
    const svgWidth = 28 * size;
    const svgHeight = 46 * size;

    return (
        <div className={`flex flex-col ${className}`} style={{ gap: '0.0rem' }}> {/* Even smaller gap */}
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
                    transform: pressed.up ? 'scale(0.95) translateY(1px)' : 'scale(1)',
                    filter: pressed.up
                        ? 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.1))'
                        : 'drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.15))',
                    marginLeft: '-19px', // This shifts the top button to the right
                }}
            >
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    viewBox="0 0 28 46"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M16.3291 4.27749L16.3388 5.80102C16.3516 7.82156 18.0542 9.41931 20.0715 9.3039L20.8556 9.25903C22.3444 9.17386 23.6265 10.2981 23.7366 11.7852C23.8596 13.4464 22.4804 14.8301 20.8189 14.7125L20.0248 14.6563C18.0453 14.5163 16.3624 16.0844 16.3624 18.0688L16.3624 20.4108C16.3624 21.9072 15.0996 23.0932 13.6061 22.9994C12.2394 22.9136 11.1749 21.7801 11.1749 20.4108L11.1749 18.0377C11.1749 16.0271 9.54497 14.3972 7.53441 14.3972L6.34287 14.3972C5.00163 14.3972 3.91172 13.3149 3.90236 11.9737C3.8929 10.6192 4.98832 9.5161 6.34287 9.5161L7.5188 9.5161C9.51163 9.5161 11.1271 7.90059 11.1271 5.90777L11.1271 4.29401C11.1271 2.7858 12.4058 1.59377 13.9103 1.69937C15.2664 1.79456 16.3205 2.91804 16.3291 4.27749Z" fill="#EEE3D6"/>
                </svg>
            </div>

            {/* Down/Decrement Octave SVG Button - moved up by 10px */}
            <div
                className="cursor-pointer transition-all duration-100 relative"
                onMouseDown={() => setPressed(prev => ({ ...prev, down: true }))}
                onMouseUp={() => {
                    setPressed(prev => ({ ...prev, down: false }));
                    handleDecrement();
                }}
                onMouseLeave={() => setPressed(prev => ({ ...prev, down: false }))}
                style={{
                    transform: pressed.down ? 'scale(0.95) translateY(1px)' : 'scale(1)',
                    filter: pressed.down
                        ? 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.1))'
                        : 'drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.15))',
                    marginLeft: '-19px', // This shifts the bottom button to the right
                    marginTop: '-70px' // Bring buttons even closer together
                }}
            >
                <svg
                    width={svgWidth}
                    height={svgHeight}
                    viewBox="0 0 28 46"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M8.1282 28.5935L20.5312 28.9131C22.4072 28.9615 23.9029 30.4962 23.9029 32.3728C23.9029 34.3155 22.3042 35.8776 20.3621 35.8327L7.95829 35.5461C6.09256 35.503 4.59352 33.9949 4.56175 32.1289C4.52808 30.1503 6.15 28.5425 8.1282 28.5935Z" fill="#EEE3D6"/>
                </svg>
            </div>
        </div>
    );
};