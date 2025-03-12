import React from 'react';
import { formatTime } from '../../../../../../features/player/utils/time.utils';

interface LoopButtonProps {
    loopEnabled: boolean;
    onClick: () => void;
    loopStart?: number;
    loopEnd?: number;
}

export const LoopButton: React.FC<LoopButtonProps> = ({
                                                          loopEnabled,
                                                          onClick,
                                                          loopStart = 0,
                                                          loopEnd = 0
                                                      }) => {
    return (
        <button
            onClick={onClick}
            title={loopEnabled ? `Loop: ${formatTime(loopStart)} - ${formatTime(loopEnd)}` : 'Enable Loop'}
            className="focus:outline-none"
            style={{
                background: 'none',
                border: 'none',
                padding: 0,
                position: 'relative',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent' // Prevent tap highlight color on mobile
            }}
        >
            {/* Loop button SVG */}
            <svg
                width="32"
                height="32"
                viewBox="0 0 88 105"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    filter: loopEnabled
                        ? 'drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.2))'
                        : 'drop-shadow(1px 1px 2px rgba(209, 205, 196, 0.8))',
                    transform: loopEnabled ? 'translateY(1px)' : 'none',
                    transition: 'transform 0.1s ease, filter 0.1s ease',
                    userSelect: 'none' // Prevent selection
                }}
            >
                <path
                    opacity="0.9"
                    d="M41.7315 74.2799C41.7315 75.3845 42.6269 76.2799 43.7315 76.2799H55.5629C55.6909 76.2799 55.8158 76.2405 55.9205 76.1669L56.5741 75.7077C62.2418 71.7258 66.2941 65.8439 67.9956 59.1295V59.1295C68.0486 58.9203 68.0754 58.7053 68.0754 58.4895V54.5181C68.0754 52.4932 67.3926 50.5275 66.1373 48.9387L64.8494 47.3086C64.3962 46.735 63.8505 46.2268 63.2479 45.813V45.813C59.4434 43.2001 58.9676 37.6856 62.3468 34.542L64.5759 32.4683C69.1131 28.2473 76.1287 28.21 80.7105 32.3825V32.3825C81.3357 32.9518 81.825 33.6544 82.1421 34.4383L84.5806 40.4658C86.8265 46.017 87.6891 52.031 87.0943 57.9897V57.9897L86.3711 65.2343C86.2507 66.4403 85.888 67.6095 85.3047 68.6719L82.566 73.6598L77.945 80.6734C77.4066 81.4905 76.7386 82.2144 75.9672 82.8165L71.3088 86.4526C70.965 86.7209 70.6021 86.964 70.2231 87.1797L63.8696 90.7959C63.6564 90.9173 63.4228 90.9983 63.1803 91.0351L53.3506 92.527C52.9036 92.5948 52.4522 92.6288 52.0001 92.6288H43.7315C42.6269 92.6288 41.7315 93.5243 41.7315 94.6288V100.463C41.7315 102.202 39.6659 103.113 38.3823 101.94L19.9119 85.0623C19.0325 84.2588 19.0461 82.8696 19.9409 82.0834L38.4114 65.8551C39.7037 64.7197 41.7315 65.6374 41.7315 67.3576V74.2799Z"
                    fill="url(#loop_gradient_1)"
                />
                <path
                    opacity="0.9"
                    d="M46.2685 30.7201C46.2685 29.6155 45.3731 28.7201 44.2685 28.7201H32.4371C32.3091 28.7201 32.1842 28.7595 32.0794 28.8331L31.4258 29.2923C25.7581 33.2742 21.7058 39.1561 20.0044 45.8705V45.8705C19.9513 46.0797 19.9245 46.2947 19.9245 46.5105V50.4819C19.9245 52.5068 20.6073 54.4725 21.8626 56.0613L23.1505 57.6914C23.6037 58.265 24.1494 58.7732 24.752 59.187V59.187C28.5565 61.7999 29.0323 67.3144 25.6531 70.458L23.424 72.5317C18.8868 76.7527 11.8712 76.79 7.28941 72.6175V72.6175C6.66421 72.0482 6.17496 71.3456 5.85783 70.5617L3.41931 64.5342C1.17345 58.983 0.310796 52.969 0.905646 47.0103V47.0103L1.62886 39.7657C1.74925 38.5597 2.11198 37.3905 2.69529 36.3281L5.43395 31.3402L10.055 24.3266C10.5933 23.5095 11.2613 22.7856 12.0327 22.1835L16.6911 18.5474C17.0349 18.2791 17.3978 18.036 17.7769 17.8203L24.1304 14.2041C24.3435 14.0827 24.5772 14.0017 24.8196 13.9649L34.6494 12.473C35.0963 12.4052 35.5477 12.3712 35.9998 12.3712H44.2685C45.3731 12.3712 46.2685 11.4757 46.2685 10.3712V4.5367C46.2685 2.798 48.334 1.8874 49.6176 3.06025L68.0881 19.9377C68.9674 20.7412 68.9539 22.1304 68.059 22.9166L49.5886 39.1449C48.2963 40.2803 46.2685 39.3626 46.2685 37.6424V30.7201Z"
                    fill="url(#loop_gradient_2)"
                />

                <defs>
                    <linearGradient id="loop_gradient_1" x1="44" y1="28" x2="44" y2="102" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#EEE3D6"/>
                        <stop offset="1" stopColor="#DFD3C5" stopOpacity="0.6"/>
                    </linearGradient>
                    <linearGradient id="loop_gradient_2" x1="44" y1="2" x2="44" y2="77" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#EEE3D6"/>
                        <stop offset="1" stopColor="#DFD3C5" stopOpacity="0.6"/>
                    </linearGradient>
                </defs>
            </svg>
        </button>
    );
};