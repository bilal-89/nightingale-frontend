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
            filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.15))',
            transform: 'scale(1)',
            stroke: 'rgba(240, 240, 240, 0.7)',
            strokeWidth: 1
        },
        pressed: {
            filter: 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.1))',
            transform: 'scale(0.98)',
            stroke: currentTrackColor ? getMutedColor(currentTrackColor) : 'rgba(224, 219, 214, 0.1)',
            strokeWidth: 0.1
        }
    };

    const handleWaveformClick = useCallback((waveform: Waveform) => {
        onWaveformChange(waveform);
    }, [onWaveformChange]);

    return (
        <div className="mt-6 flex justify-center">
            <div className="flex space-x-8 items-center" style={{marginTop:'-27px'}} >
                {/* Individual clickable buttons for each waveform */}
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
                        viewBox="0 0 40 30"
                        style={{
                            filter: currentWaveform === 'sine' 
                                ? neumorphicStyles.pressed.filter
                                : neumorphicStyles.normal.filter,
                            transform: currentWaveform === 'sine' 
                                ? neumorphicStyles.pressed.transform
                                : neumorphicStyles.normal.transform,
                            transition: 'all 0.1s ease',
                            marginTop:'-26px',
                            rotate:'14deg'
                        }}
                    >
                        <path
                            d="M1.25809 12.7114L1.87007 11.0718C2.97785 8.10376 5.75302 6.09804 8.92366 5.97387L11.9272 5.85624C14.6946 5.74785 17.0992 7.78584 17.4524 10.5393L17.8769 13.8479C18.1272 15.7986 20.2026 16.9547 21.9784 16.1325C22.8228 15.7416 23.4235 14.9652 23.5914 14.0476L24.0377 11.6087C24.6956 8.0135 27.8277 5.39459 31.4838 5.33725C35.4508 5.27503 38.9045 8.19607 39.4599 12.1333L39.7795 14.3992L40.5081 20.7345C40.7436 22.7826 39.2326 24.6018 37.1808 24.7405C35.1335 24.8789 33.3657 23.2887 33.2834 21.2347L33.2372 20.0841C33.2172 19.5835 33.2765 19.0836 33.4129 18.6029L34.3725 15.2223C34.4878 14.816 34.538 14.3935 34.521 13.9704L34.457 12.3748C34.4031 11.0295 33.2643 9.97685 31.9212 10.0307C30.7348 10.0783 29.7653 10.9808 29.6328 12.1612L29.092 16.9795C28.6976 20.4928 26.0741 23.3271 22.6062 23.9866L21.815 24.1371C17.3804 24.9804 13.1443 21.8339 12.6526 17.3315L12.207 13.2503C12.1176 12.4318 11.5216 11.755 10.7209 11.5628C9.48851 11.2669 8.31869 12.2133 8.35195 13.4792L8.37279 14.2722L8.39892 15.2667C8.43782 16.7471 7.47921 18.061 6.06119 18.4708C5.80965 18.5435 5.55004 18.5856 5.28794 18.5961L5.22191 18.5987C3.82962 18.6546 2.51124 17.9462 1.78257 16.7507L1.62447 16.4913C0.928727 15.3498 0.793611 13.9559 1.25809 12.7114Z"
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
                        viewBox="0 0 44 30"
                        style={{
                            filter: currentWaveform === 'square' 
                                ? neumorphicStyles.pressed.filter
                                : neumorphicStyles.normal.filter,
                            transform: currentWaveform === 'square' 
                                ? neumorphicStyles.pressed.transform
                                : neumorphicStyles.normal.transform,
                            transition: 'all 0.1s ease',
                            rotate:'6deg'
                        }}
                    >
                        <path
                            d="M52.5 25.4835L54 7.79345L69.8686 7.79345L69.7573 20.0401L75.9646 19.9647L76.0758 7.71808L91.5923 7.52966L91.481 19.7763L96.0359 19.721L95.9875 25.0433L87.2468 25.1494L87.2468 14.9198L82 14.9478L82 25.0433L65.1046 25.4183L65.1073 14.8827L59.7385 14.9478L59.7358 25.4835L52.5 25.4835Z"
                            fill="#EEE3D6"
                            transform="translate(-52, 0)"
                            stroke={currentWaveform === 'square' 
                                ? neumorphicStyles.pressed.stroke
                                : neumorphicStyles.normal.stroke}
                            strokeWidth={currentWaveform === 'square' 
                                ? neumorphicStyles.pressed.strokeWidth
                                : neumorphicStyles.normal.strokeWidth}
                        />
                    </svg>
                </div>

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
                        viewBox="0 0 35 30"
                        style={{
                            filter: currentWaveform === 'sawtooth' 
                                ? neumorphicStyles.pressed.filter
                                : neumorphicStyles.normal.filter,
                            transform: currentWaveform === 'sawtooth' 
                                ? neumorphicStyles.pressed.transform
                                : neumorphicStyles.normal.transform,
                            transition: 'all 0.1s ease',
                            rotate:'-12deg'
                        }}
                    >
                        <path
                            d="M106.75 19.5525L111.91 8.44599C112.555 7.05845 114.462 6.89707 115.352 8.15472L121.717 17.1486C122.513 18.2742 124.173 18.2889 124.971 17.1774L131.77 7.70211C132.674 6.44305 134.612 6.66475 135.231 8.09785L138.834 16.4466L141.3 23.3502C141.323 23.4143 141.341 23.4801 141.354 23.5468C141.631 24.9307 139.917 25.7879 138.966 24.7414L137.334 22.9466L133.73 18.2604C132.99 17.2992 131.58 17.2012 130.731 18.0519L124.82 23.9683C124.016 24.773 122.697 24.7357 121.926 23.8864L114.891 16.1374C114.077 15.2407 112.667 15.2573 111.89 16.1727L108.214 20.4993C107.985 20.7698 107.613 20.8728 107.274 20.7599C106.774 20.5933 106.529 20.0279 106.75 19.5525Z"
                            fill="#EEE3D6"
                            transform="translate(-106, 0)"
                            stroke={currentWaveform === 'sawtooth' 
                                ? neumorphicStyles.pressed.stroke
                                : neumorphicStyles.normal.stroke}
                            strokeWidth={currentWaveform === 'sawtooth' 
                                ? neumorphicStyles.pressed.strokeWidth
                                : neumorphicStyles.normal.strokeWidth}
                        />
                    </svg>
                </div>

                <div 
                    className="p-4 cursor-pointer" 
                    onClick={() => handleWaveformClick('triangle')}
                    title={WAVEFORM_NAMES.triangle}
                    style={{
                        borderRadius: '8px',
                        transition: 'all 0.1s ease',
                        marginTop:'-26px',
                        rotate:'-22deg'


                    }}
                >
                    <svg
                        width="60"
                        height="50"
                        viewBox="0 0 38 30"
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
                            d="M154.794 23.5702L169.431 1.65728L169.224 17.0523L187.655 3.87873L186.933 19.2109L192.281 19.8627L182.856 27.523L183.592 11.9066L166.687 24.7423L167.226 13.3093L154.794 23.5702Z"
                            fill="#EEE3D6"
                            transform="translate(-154, 0)"
                            stroke={currentWaveform === 'triangle' 
                                ? neumorphicStyles.pressed.stroke
                                : neumorphicStyles.normal.stroke}
                            strokeWidth={currentWaveform === 'triangle' 
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