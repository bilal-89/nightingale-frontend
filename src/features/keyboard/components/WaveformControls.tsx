import React, { useCallback } from 'react';
import { Waveform } from '../store/slices/keyboard.slice';
import { getMutedColor } from '../../../shared/constants/colors';
import { useAppSelector } from "../../player/hooks";

interface WaveformControlsProps {
    currentWaveform: Waveform;
    onWaveformChange: (waveform: Waveform) => void;
}

// Map between waveform types and their display names (for accessibility/tooltips)
const WAVEFORM_NAMES = {
    sine: 'Sine',
    square: 'Square',
    sawtooth: 'Sawtooth',
    triangle: 'Triangle'
};

const WaveformControls: React.FC<WaveformControlsProps> = ({
                                                               currentWaveform,
                                                               onWaveformChange
                                                           }) => {
    // Get the current track color from Redux state
    const currentTrack = useAppSelector(state => state.player.currentTrack);
    const tracks = useAppSelector(state => state.player.tracks);
    const currentTrackColor = tracks[currentTrack]?.color;

    // Neumorphic styles with dynamic track color for pressed state
    const neumorphicStyles = {
        normal: {
            filter: 'drop-shadow(1px 1px 0px #EEE3D6)',
            transform: 'scale(1)',
            stroke: 'rgba(240, 240, 240, 0.7)',
            strokeWidth: 1
        },
        pressed: {
            filter: 'drop-shadow(0px 0px 0px rgba(0, 0, 0, 0.1))',
            transform: 'scale(0.95)',
            stroke: currentTrackColor ? getMutedColor(currentTrackColor) : 'rgba(224, 219, 214, 0.2)',
            strokeWidth: 0.1
        }
    };

    const handleWaveformClick = useCallback((waveform: Waveform) => {
        onWaveformChange(waveform);
    }, [onWaveformChange]);

    return (
        <div className="mt-6 flex justify-center">
            <div className="flex space-x-5 items-center" style={{marginTop:'-27px'}} >
                {/* Sine Wave Button */}
                <div
                    className="p-4 cursor-pointer"
                    onClick={() => handleWaveformClick('sine')}
                    title={WAVEFORM_NAMES.sine}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 20 21"
                        style={{
                            filter: currentWaveform === 'sine'
                                ? neumorphicStyles.pressed.filter
                                : neumorphicStyles.normal.filter,
                            transform: currentWaveform === 'sine'
                                ? neumorphicStyles.pressed.transform
                                : neumorphicStyles.normal.transform,
                            transition: 'all 0.1s ease',
                            marginTop:'-6px',
                            rotate:'0deg'
                        }}
                    >
                        <path
                            d="M11.2509 20.262L10.6525 20.2959C5.2666 20.6008 0.664311 16.3741 0.504948 10.9764C0.360536 6.0851 3.9591 1.90685 8.80809 1.30867C9.35877 1.24074 9.91665 1.22077 10.4716 1.24947L11.0447 1.2791C15.9624 1.5334 19.9036 5.50048 20.1269 10.4208C20.3617 15.5945 16.4156 19.9697 11.2509 20.262Z"
                            fill="#EEE3D6"
                            stroke={currentWaveform === 'sine'
                                ? neumorphicStyles.pressed.stroke
                                : neumorphicStyles.normal.stroke}
                            strokeWidth={currentWaveform === 'sine'
                                ? neumorphicStyles.pressed.strokeWidth
                                : neumorphicStyles.normal.strokeWidth}
                        />
                    </svg>
                </div>

                {/* Square Wave Button */}
                <div
                    className="p-4 cursor-pointer"
                    onClick={() => handleWaveformClick('square')}
                    title={WAVEFORM_NAMES.square}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 16 16"
                        style={{
                            filter: currentWaveform === 'square'
                                ? neumorphicStyles.pressed.filter
                                : neumorphicStyles.normal.filter,
                            transform: currentWaveform === 'square'
                                ? neumorphicStyles.pressed.transform
                                : neumorphicStyles.normal.transform,
                            transition: 'all 0.1s ease',
                            marginTop:'30px',

                            rotate:'0deg'
                        }}
                    >
                        <path
                            d="M29.6878 13.8589L29.7375 4.7232C29.7465 3.0688 31.0916 1.74497 32.7446 1.76357L42.3351 1.8715C43.9942 1.89018 45.3342 3.25373 45.3252 4.91423L45.2765 13.8735C45.2676 15.5065 43.9559 16.8216 42.3245 16.8333L32.733 16.9018C31.0525 16.9138 29.6787 15.541 29.6878 13.8589Z"
                            fill="#EEE3D6"
                            transform="translate(-29.6, -1.5)"
                            stroke={currentWaveform === 'square'
                                ? neumorphicStyles.pressed.stroke
                                : neumorphicStyles.normal.stroke}
                            strokeWidth={currentWaveform === 'square'
                                ? neumorphicStyles.pressed.strokeWidth
                                : neumorphicStyles.normal.strokeWidth}
                        />
                    </svg>
                </div>

                {/* Triangle Wave Button */}
                <div
                    className="p-4 cursor-pointer"
                    onClick={() => handleWaveformClick('triangle')}
                    title={WAVEFORM_NAMES.triangle}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                        marginTop:'-6px',
                        rotate:'-0deg'
                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 20 17"
                        style={{
                            filter: currentWaveform === 'triangle'
                                ? neumorphicStyles.pressed.filter
                                : neumorphicStyles.normal.filter,
                            transform: currentWaveform === 'triangle'
                                ? neumorphicStyles.pressed.transform
                                : neumorphicStyles.normal.transform,
                            transition: 'all 0.1s ease',
                        }}
                    >
                        <path
                            d="M57.5308 18.5293L73.3018 18.4606C74.8831 18.4537 75.8462 16.7011 74.998 15.3738L66.9071 2.71206C66.1115 1.46702 64.2779 1.50183 63.5088 2.77657L55.8288 15.507C55.0225 16.8435 55.9757 18.5361 57.5308 18.5293Z"
                            fill="#EEE3D6"
                            transform="translate(-55.5, -1.5)"
                            stroke={currentWaveform === 'triangle'
                                ? neumorphicStyles.pressed.stroke
                                : neumorphicStyles.normal.stroke}
                            strokeWidth={currentWaveform === 'triangle'
                                ? neumorphicStyles.pressed.strokeWidth
                                : neumorphicStyles.normal.strokeWidth}
                        />
                    </svg>
                </div>

                {/* Sawtooth Wave Button */}
                <div
                    className="p-4 cursor-pointer"
                    onClick={() => handleWaveformClick('sawtooth')}
                    title={WAVEFORM_NAMES.sawtooth}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 14 15"
                        style={{
                            filter: currentWaveform === 'sawtooth'
                                ? neumorphicStyles.pressed.filter
                                : neumorphicStyles.normal.filter,
                            transform: currentWaveform === 'sawtooth'
                                ? neumorphicStyles.pressed.transform
                                : neumorphicStyles.normal.transform,
                            transition: 'all 0.1s ease',
                            rotate:'-0deg'
                        }}
                    >
                        <path
                            d="M84.1801 14.9837L95.2731 2.05525C95.8763 1.35217 97.0365 1.7875 97.0365 2.71694L97.0365 15.6454C97.0365 16.1939 96.5933 16.6362 96.0438 16.6362L84.9508 16.6362C84.0937 16.6362 83.6248 15.6309 84.1801 14.9837Z"
                            fill="#EEE3D6"
                            transform="translate(-84, -1.5)"
                            stroke={currentWaveform === 'sawtooth'
                                ? neumorphicStyles.pressed.stroke
                                : neumorphicStyles.normal.stroke}
                            strokeWidth={currentWaveform === 'sawtooth'
                                ? neumorphicStyles.pressed.strokeWidth
                                : neumorphicStyles.normal.strokeWidth}
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default WaveformControls;