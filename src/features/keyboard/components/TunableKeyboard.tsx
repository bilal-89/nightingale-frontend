// TunableKeyboard.tsx - Updated with SVG layout
import React, { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { Card } from '../../../shared/components/ui/card';
import TunableKey from './TunableKey';
import { OctaveControls } from './OctaveControls';
import {
    noteOn,
    noteOff,
    setKeyParameter,
    setMode,
    setGlobalWaveform,
    togglePanel,
    selectActiveNotes,
    selectParameter,
    selectIsInitialized,
    selectMode,
    selectIsPanelVisible,
    selectGlobalWaveform,
    selectCurrentOctave,
    SynthMode,
    Waveform
} from '../store/slices/keyboard.slice';
import { initializeAudioContext } from '../../audio/store/actions.ts';
import { RootState } from '../../../store';
import { useTiming } from '../../player/hooks/useTiming.ts';
import keyboardAudioManager from '../../../../src/features/audio/engine/synthesis/keyboardEngine';

// Define key shapes and positions
const KEY_DATA = {
    // Format: MIDI note number: { path data, noteName, keyLabel }
    60: { // C
        path: "M169.5 120.531L170.5 111.531L172 101.031L173 87.0312L174 76.5312L179.096 38.7345C179.614 34.8941 182.889 32.0311 186.765 32.0311V32.0311C191.23 32.0311 194.779 35.7773 194.519 40.2348C193.721 53.8992 192.202 80.2203 192.104 84.1997L191.738 99.0655L191.131 123.733L190.524 148.4L190.158 163.266C190.025 168.68 188.234 173.024 186.157 172.969L177.384 172.74L164.852 172.411L152.319 172.083L143.546 171.853C141.47 171.799 139.894 167.366 140.028 161.953L140.394 147.087L140.697 134.754V134.754C140.78 131.404 143.658 128.814 146.998 129.085L152.5 129.531L162.319 129.909C164.305 129.985 166.195 129.059 167.349 127.443V127.443C167.779 126.84 168.092 126.162 168.272 125.444L169.5 120.531Z",
        noteName: "C", 
        keyLabel: "A"
    },
    61: { // C#
        path: "M227.461 44.996C227.153 39.5907 228.584 35.1049 230.657 34.9767L239.418 34.4351L251.933 33.6613L264.448 32.8876L273.208 32.346C275.282 32.2178 277.213 36.4957 277.521 41.901L278.368 56.745L279.772 81.3761L281.177 106.007L282.024 120.851C282.332 126.257 280.901 130.742 278.827 130.87L270.067 131.412L257.552 132.186L245.037 132.96L236.276 133.501C234.203 133.629 232.272 129.351 231.963 123.946L231.117 109.102L229.712 84.4711L228.307 59.8399L227.461 44.996Z",
        noteName: "C♯", 
        keyLabel: "W"
    },
    62: { // D
        path: "M207.532 84.1668L206.691 44.1242C206.587 39.1804 210.648 35.1531 215.59 35.2984V35.2984C220.066 35.4301 223.693 38.9615 223.944 43.4319L226 80.0312L227.5 103.031L228.708 126.782C228.886 130.287 231.085 133.365 234.342 134.668L234.893 134.888C235.954 135.313 237.088 135.531 238.232 135.531L244.895 135.531L249.907 135.531C254.517 135.531 258.377 139.015 258.846 143.601L259.203 147.088L259.56 161.954C259.69 167.368 258.112 171.799 256.035 171.852L247.262 172.076L234.73 172.396L222.197 172.716L213.424 172.94C211.347 172.993 209.559 168.648 209.429 163.235L209.072 148.368L208.48 123.701L207.889 99.0328L207.532 84.1668Z",
        noteName: "D", 
        keyLabel: "S"
    },
    63: { // D#
        path: "M127.467 34.4677C128.12 29.0947 130.32 24.955 132.381 25.2215L141.088 26.3472L153.528 27.9554L165.967 29.5637L174.674 30.6894C176.736 30.9559 177.877 35.5276 177.225 40.9006L175.432 55.6558L172.459 80.1397L169.485 104.624L167.693 119.379C167.04 124.752 164.84 128.891 162.779 128.625L154.072 127.499L141.632 125.891L129.193 124.283L120.485 123.157C118.424 122.891 117.283 118.319 117.935 112.946L119.727 98.1907L122.701 73.7068L125.675 49.2229L127.467 34.4677Z",
        noteName: "D♯", 
        keyLabel: "E"
    },
    64: { // E
        path: "M283.5 102.031L281.614 81.5312L278.404 38.4519C278.18 35.4452 280.41 32.8017 283.411 32.5159V32.5159C286.282 32.2424 288.866 34.2281 289.34 37.0718L296.5 80.0312L298 92.5312L300.5 110.031L302.127 122.925C302.559 126.352 304.915 129.218 308.19 130.299L309.061 130.587C310.337 131.008 311.693 131.137 313.029 130.963L317.527 130.379V130.379C321.115 129.913 324.373 132.476 324.763 136.073L325.569 143.511L326.912 158.317C327.402 163.709 326.122 168.241 324.054 168.441L315.316 169.285L302.834 170.49L290.352 171.696L281.614 172.539C279.546 172.739 277.473 168.53 276.984 163.139L275.641 148.333L274.504 141.801C273.92 138.442 275.776 135.121 278.949 133.852V133.852C281.695 132.753 283.5 130.089 283.5 127.135L283.5 102.031Z",
        noteName: "E", 
        keyLabel: "D"
    },
    65: { // F
        path: "M355.973 118.278C356.32 117.127 356.419 115.917 356.263 114.728L352.5 86.0404L343.688 31.3045C343.289 28.8269 344.71 26.4011 347.07 25.5318V25.5318C349.975 24.4616 353.144 26.1369 353.886 29.1343L364 70.0311L367.5 86.0404L372.604 107.376C372.866 108.47 373.33 109.503 373.974 110.422L376.738 114.371C378.693 117.163 382.202 118.402 385.496 117.461L386.513 117.17C390.534 116.022 394.642 118.573 395.386 122.681V122.681L397.077 134.895L399.115 149.616C399.858 154.977 398.792 159.568 396.736 159.871L388.049 161.152L375.638 162.981L363.227 164.81L354.54 166.09C352.484 166.393 350.215 162.293 349.473 156.933L347.434 142.212L345.743 129.998V129.998C345.743 127.098 347.758 124.573 350.584 123.931L350.831 123.874C353.121 123.354 354.961 121.634 355.641 119.38L355.973 118.278Z",
        noteName: "F", 
        keyLabel: "F"
    },
    66: { // F#
        path: "M65.8021 17.0536C67.0526 11.7945 69.7324 7.95287 71.7876 8.47304L80.4702 10.6707L92.874 13.8102L105.278 16.9497L113.96 19.1474C116.015 19.6676 116.668 24.3526 115.417 29.6116L111.983 44.054L106.284 68.0187L100.586 91.9834L97.1512 106.426C95.9006 111.685 93.2209 115.526 91.1657 115.006L82.4831 112.809L70.0794 109.669L57.6756 106.53L48.993 104.332C46.9378 103.812 46.2856 99.1268 47.5362 93.8677L50.9705 79.4254L56.6691 55.4607L62.3678 31.4959L65.8021 17.0536Z",
        noteName: "F♯", 
        keyLabel: "T"
    },
    67: { // G
        path: "M427.643 95.7153C427.643 94.9293 427.542 94.1477 427.341 93.3904L423 77.0312L419 63.5311L406.558 16.3368C405.387 11.8946 407.73 7.23922 411.995 5.53303L413.874 4.78133C414.291 4.61473 414.719 4.47959 415.155 4.37706L415.459 4.30552C419.793 3.28581 424.179 5.61005 425.773 9.77001L441 49.5311L448.5 69.0311L458 95.5311L464.077 112.023L468.64 126.157C470.302 131.303 470.051 136.015 468.08 136.681L459.755 139.494L447.862 143.512L435.969 147.53L427.643 150.343C425.673 151.009 422.728 147.377 421.067 142.23L416.504 128.097L413 115.531L412.965 115.372C412.405 112.855 413.707 110.272 416.064 109.225V109.225C416.354 109.096 416.655 108.993 416.963 108.918L421.795 107.731C422.337 107.598 422.863 107.406 423.364 107.157V107.157C425.98 105.857 427.643 103.17 427.643 100.243L427.643 95.7153Z",
        noteName: "G", 
        keyLabel: "G"
    },
    68: { // G#
        path: "M356.798 31.112C355.471 25.8655 356.025 21.1828 358.035 20.6529L366.526 18.4143L378.657 15.2161L390.787 12.018L399.279 9.77935C401.289 9.24946 403.994 13.073 405.32 18.3195L408.964 32.7272L415.009 56.6345L421.055 80.5418L424.699 94.9495C426.025 100.196 425.471 104.879 423.462 105.409L414.97 107.647L402.839 110.845L390.709 114.043L382.217 116.282C380.207 116.812 377.503 112.989 376.176 107.742L372.532 93.3343L366.487 69.427L360.441 45.5197L356.798 31.112Z",
        noteName: "G♯", 
        keyLabel: "Y"
    },
    69: { // A
        path: "M32.5001 48.0311L42.0001 28.5311L50.302 9.55516C51.5769 6.64121 54.7218 5.11072 57.79 5.91112V5.91112C61.2469 6.81291 63.4313 10.3463 62.7172 13.8811L54 57.0312L52 66.0312L48 80.5312L44.0241 96.1288C42.6833 101.389 46.1831 106.76 51.4899 107.585L54.5197 108.056C59.1612 108.778 61.8213 113.941 59.7314 118.172V118.172L56 128.031L50.1192 140.551C48.1733 145.554 45.0313 148.946 43.1012 148.128L34.9469 144.671L23.298 139.733L11.649 134.795L3.49469 131.338C1.56462 130.52 1.5774 125.801 3.52325 120.799L8.86684 107.06L17.7337 84.2631L26.6005 61.4661L32.5001 48.0311Z",
        noteName: "A", 
        keyLabel: "H"
    },
    70: { // A#
        path: "M292.337 41.6653C291.519 36.3164 292.519 31.7096 294.571 31.3757L303.239 29.9651L315.623 27.9499L328.007 25.9348L336.675 24.5241C338.727 24.1903 341.053 28.2557 341.871 33.6047L344.116 48.2937L347.843 72.6677L351.569 97.0418L353.815 111.731C354.633 117.08 353.632 121.687 351.58 122.02L342.912 123.431L330.528 125.446L318.145 127.461L309.476 128.872C307.425 129.206 305.098 125.14 304.281 119.791L302.035 105.102L298.309 80.7283L294.582 56.3543L292.337 41.6653Z",
        noteName: "A♯", 
        keyLabel: "U"
    },
    71: { // B
        path: "M104 88.0312L105.5 81.5312L107 73.5312L118.38 28.4645C118.971 26.1248 121.492 24.8848 123.718 25.8388V25.8388C125.362 26.5433 126.353 28.2583 126.14 30.0312L120.5 77.0312L119.5 88.0312L117 106.031L115.854 119.422C115.648 121.831 117.162 124.077 119.471 124.789V124.789C121.807 125.509 123.324 127.795 123.082 130.227L121.463 146.484L118.488 161.023C117.404 166.318 114.878 170.245 112.846 169.795L104.259 167.895L91.9917 165.181L79.7246 162.467L71.1376 160.567C69.1052 160.117 68.3357 155.461 69.4191 150.167L72.3942 135.628L74.8626 123.565L74.9499 123.083C75.8147 118.312 80.2887 115.142 85.0696 115.913L90.1036 116.725C91.3416 116.925 92.6053 116.762 93.7435 116.256V116.256C95.4911 115.48 96.7974 113.961 97.3126 112.106L104 88.0312Z",
        noteName: "B", 
        keyLabel: "J"
    }
};

const waveformLabels: Record<Waveform, string> = {
    sine: "Sine",
    square: "Square",
    sawtooth: "Saw",
    triangle: "Triangle"
};

const modeStyles: Record<SynthMode, {
    background: string;
    containerBg: string;
    buttonBg: string;
    textColor: string;
    shadow: string;
    innerShadow: string;
}> = {
    tunable: {
        background: 'from-[#e5e9ec] to-[#e5e9ec]',
        containerBg: 'bg-[#e5e9ec]',
        buttonBg: 'bg-[#e5e9ec]',
        textColor: 'text-[#4a4543]',
        shadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff',
        innerShadow: 'inset 8px 8px 16px #c8ccd0, inset -8px -8px 16px #ffffff'
    },
    drums: {
        background: 'from-[#e5e9ec] to-[#e5e9ec]',
        containerBg: 'bg-[#e5e9ec]',
        buttonBg: 'bg-[#e5e9ec]',
        textColor: 'text-[#4a4543]',
        shadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff',
        innerShadow: 'inset 8px 8px 16px #c8ccd0, inset -8px -8px 16px #ffffff'
    }
};

// Add this CSS to your component or a separate CSS file
const keyStyles = `
  .key-shape {
    cursor: pointer;
    transition: all 120ms cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(3px 3px 5px rgba(209, 205, 196, 0.7)) 
            drop-shadow(-2px -2px 4px rgba(255, 255, 255, 0.9));
  }
  
  .key-shape:hover {
    filter: drop-shadow(2px 2px 3px rgba(209, 205, 196, 0.5)) 
            drop-shadow(-1px -1px 2px rgba(255, 255, 255, 0.7));
    transform: translateY(1px);
  }
  
  .key-shape.pressed {
    filter: inset(2px 2px 4px rgba(209, 205, 196, 0.8)) 
            inset(-1px -1px 2px rgba(255, 255, 255, 0.4));
    transform: translateY(2px);
    fill: url(#keyGradientPressed);
  }

  .filter-container-pressed {
    filter: url(#container-inner-shadow) !important;
  }
`;

// Main component
const TunableKeyboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const timing = useTiming();
    const activeNotes = useSelector(selectActiveNotes);
    const isInitialized = useSelector(selectIsInitialized);
    const currentMode = useSelector(selectMode);
    const currentWaveform = useSelector(selectGlobalWaveform);
    const isPanelVisible = useSelector(selectIsPanelVisible);
    const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
    const tracks = useSelector((state: RootState) => state.player.tracks);
    const currentTrackColor = tracks[currentTrack]?.color;
    const currentOctave = useSelector(selectCurrentOctave);

    const [isPressed, setIsPressed] = useState(false);
    const [clickedContainer, setClickedContainer] = useState(false);

    const initializeAudio = useCallback(() => {
        if (!isInitialized) {
            dispatch(initializeAudioContext());
        }
    }, [dispatch, isInitialized]);

    const handleNoteOn = useCallback((note: number) => {
        initializeAudio();
        dispatch(noteOn(note));
    }, [dispatch, initializeAudio]);

    const handleNoteOff = useCallback((note: number) => {
        dispatch(noteOff(note));
    }, [dispatch]);

    const handleTuningChange = useCallback((note: number, cents: number) => {
        keyboardAudioManager.setNoteParameter(note, 'tuning', cents);
        timing.saveTuningState(note, cents);
        dispatch(setKeyParameter({
            keyNumber: note,
            parameter: 'tuning',
            value: cents
        }));
    }, [dispatch, timing]);

    const handleWaveformChange = useCallback((newWaveform: Waveform) => {
        dispatch(setGlobalWaveform(newWaveform));
    }, [dispatch]);

    const handlePanelClick = useCallback(() => {
        dispatch(togglePanel());
    }, [dispatch]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsPressed(true);
            setClickedContainer(true);
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        if (isPressed && clickedContainer) {
            dispatch(setMode(currentMode === 'tunable' ? 'drums' : 'tunable'));
        }
        setIsPressed(false);
        setClickedContainer(false);
    }, [isPressed, clickedContainer, currentMode, dispatch]);

    const handleMouseLeave = useCallback(() => {
        setIsPressed(false);
        setClickedContainer(false);
    }, []);

    // Helper function for adjusting notes with octave
    const getAdjustedNote = (baseNote: number, octave: number) => {
        return baseNote + ((octave - 4) * 12); // Adjust relative to middle octave (4)
    };

    // Keyboard event handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if modifier keys are pressed or if the key is already pressed
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;
            if (e.repeat) return; // Prevent key repeat
            
            // Map computer keyboard keys to MIDI notes
            const keyToNote: Record<string, number> = {
                'a': 60, // C
                'w': 61, // C#
                's': 62, // D
                'e': 63, // D#
                'd': 64, // E
                'f': 65, // F
                't': 66, // F#
                'g': 67, // G
                'y': 68, // G#
                'h': 69, // A
                'u': 70, // A#
                'j': 71, // B
                'k': 72, // C (octave up)
            };

            const note = keyToNote[e.key.toLowerCase()];
            if (note !== undefined) {
                e.preventDefault();
                handleNoteOn(note + (currentOctave - 4) * 12);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            // Skip if modifier keys are pressed
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

            // Map computer keyboard keys to MIDI notes
            const keyToNote: Record<string, number> = {
                'a': 60, // C
                'w': 61, // C#
                's': 62, // D
                'e': 63, // D#
                'd': 64, // E
                'f': 65, // F
                't': 66, // F#
                'g': 67, // G
                'y': 68, // G#
                'h': 69, // A
                'u': 70, // A#
                'j': 71, // B
                'k': 72, // C (octave up)
            };

            const note = keyToNote[e.key.toLowerCase()];
            if (note !== undefined) {
                e.preventDefault();
                handleNoteOff(note + (currentOctave - 4) * 12);
            }
        };
        
        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        
        // Clean up
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [currentOctave, handleNoteOn, handleNoteOff]);

    // Add this to your component to handle key interactions
    useEffect(() => {
        const keyElements = document.querySelectorAll('.key-shape');
        
        keyElements.forEach(key => {
            const noteNumber = parseInt(key.getAttribute('data-note') || '0', 10);
            const adjustedNote = getAdjustedNote(noteNumber, currentOctave);
            
            key.addEventListener('mousedown', () => {
                handleNoteOn(adjustedNote);
                key.classList.add('pressed');
            });
            
            key.addEventListener('mouseup', () => {
                handleNoteOff(adjustedNote);
                key.classList.remove('pressed');
            });
            
            key.addEventListener('mouseleave', () => {
                if (key.classList.contains('pressed')) {
                    handleNoteOff(adjustedNote);
                    key.classList.remove('pressed');
                }
            });
        });
        
        // Update pressed state based on activeNotes
        const updatePressedState = () => {
            keyElements.forEach(key => {
                const noteNumber = parseInt(key.getAttribute('data-note') || '0', 10);
                const adjustedNote = getAdjustedNote(noteNumber, currentOctave);
                
                if (activeNotes.includes(adjustedNote)) {
                    key.classList.add('pressed');
                } else {
                    key.classList.remove('pressed');
                }
            });
        };
        
        updatePressedState();
        
        return () => {
            keyElements.forEach(key => {
                key.removeEventListener('mousedown', () => {});
                key.removeEventListener('mouseup', () => {});
                key.removeEventListener('mouseleave', () => {});
            });
        };
    }, [activeNotes, currentOctave, handleNoteOn, handleNoteOff]);

    // Create notes array with base note IDs
    const notes = Array.from({ length: 12 }, (_, i) => {
        const baseNote = 60 + i; // Keep base note constant
        const adjustedNote = getAdjustedNote(baseNote, currentOctave);
        return {
            note: adjustedNote,
            baseNote: baseNote, // Store the base note (60-71) for mapping to SVG paths
            frequency: 440 * Math.pow(2, (adjustedNote - 69) / 12)
        };
    });

    const currentStyle = modeStyles[currentMode];

    // New SVG-based layout
    return (
        <Card className={`p-8 bg-gradient-to-br transition-all duration-300 ease-in-out ${currentStyle.background}`}>
            <div className="flex flex-row gap-6">
                {/* Move Octave Controls to the side */}
                <div className="flex-none">
                    <OctaveControls className="p-4" />
                </div>

                {/* Main Keyboard Container */}
                <div className="flex-1 relative">
                    <div className="relative w-full h-auto">
                        <svg
                            viewBox="-10 -5 572 262"
                            width="100%"
                            height="auto"
                            className="relative z-0"
                        >
                            {/* Background container shape with consistent color */}
                            <path 
                                opacity="0.3"
                                d="M118.594 6.71135L182 21L261.875 29.5741C267.614 30.1902 273.396 30.3082 279.156 29.9268L346 25.5L416.118 12.9146C421.362 11.9734 426.68 11.5 432.007 11.5H440.348C459.903 11.5 478.585 19.5994 491.952 33.8727C497.607 39.9107 502.158 46.8943 505.398 54.5056L522 93.5L536.05 121.175C537.681 124.387 539.054 127.723 540.156 131.152L544.929 146.001C549.313 159.64 546.185 174.58 536.698 185.315C534.244 188.092 531.422 190.52 528.309 192.531L509.634 204.598C503.562 208.521 497.084 211.774 490.311 214.301L448.707 229.82C441.262 232.597 433.513 234.476 425.623 235.419L358 243.5L267 247L203 243.5L143.5 234L83.9225 219.878C78.6496 218.628 73.4869 216.952 68.4856 214.865L43.691 204.521C36.53 201.534 29.9984 197.22 24.4402 191.806C9.23634 176.997 2.73408 155.399 7.23464 134.658L9.26058 125.321C10.7469 118.471 13.1405 111.85 16.3782 105.633L32.8527 74L51.983 38.9735C53.6094 35.9958 55.4665 33.1499 57.5374 30.4622L59.3698 28.084C69.9132 14.3999 85.9637 6.07299 103.223 5.33332C108.385 5.11208 113.554 5.57545 118.594 6.71135Z" 
                                fill="url(#keyGradient)" 
                                stroke="#e8e4dc"
                                strokeWidth="2"
                                filter="url(#container-shadow)"
                                className="cursor-pointer active:translate-y-1 active:opacity-40 active:filter-container-pressed transition-all duration-75"
                                onClick={() => {
                                    const newMode = currentMode === 'tunable' ? 'drums' : 'tunable';
                                    console.log('Switching mode to:', newMode);
                                    dispatch(setMode(newMode));
                                }}
                                style={{ pointerEvents: 'all' }}
                            />

                            {/* Add a filter for the container */}
                            <filter id="container-shadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="#d1cdc4" floodOpacity="0.4" />
                                <feDropShadow dx="-3" dy="-3" stdDeviation="3" floodColor="#ffffff" floodOpacity="0.6" />
                            </filter>

                            {/* Add this filter for the pressed state of the container */}
                            <filter id="container-inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
                                <feOffset dx="2" dy="2" />
                                <feGaussianBlur stdDeviation="3" result="offset-blur" />
                                <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                                <feFlood floodColor="#c8c4bb" floodOpacity="0.8" result="color" />
                                <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                                <feComposite operator="over" in="shadow" in2="SourceGraphic" />
                            </filter>

                            {/* Enhanced gradients and other defs */}
                            <defs>
                                {/* Enhanced gradients with more distinct raised vs pressed states */}
                                <linearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#F9F7F3" />
                                    <stop offset="100%" stopColor="#F2F0EB" />
                                </linearGradient>
                                <linearGradient id="keyGradientPressed" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#E5E0DB" />
                                    <stop offset="100%" stopColor="#D8D3CE" />
                                </linearGradient>

                                {/* Individual filters for each key */}
                                {notes.map(({baseNote}) => (
                                    <React.Fragment key={`filters-${baseNote}`}>
                                        {/* Outer shadow for raised state */}
                                        <filter id={`outer-shadow-${baseNote % 12}`} x="-30%" y="-30%" width="160%" height="160%">
                                            {/* Soft shadow at bottom-right */}
                                            <feDropShadow dx="4" dy="4" stdDeviation="2.5" floodColor="#d1cdc4" floodOpacity="0.8" />

                                            {/* Light highlight at top-left */}
                                            <feDropShadow dx="-3" dy="-3" stdDeviation="2" floodColor="#ffffff" floodOpacity="0.9" />
                                        </filter>

                                        {/* Inner shadow for pressed state */}
                                        <filter id={`inner-shadow-${baseNote % 12}`} x="-30%" y="-30%" width="160%" height="160%">
                                            {/* Main shadow effect for pressed state */}
                                            <feOffset dx="1.5" dy="1.5" />
                                            <feGaussianBlur stdDeviation="1.8" result="offset-blur" />
                                            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                                            <feFlood floodColor="#c8c4bb" floodOpacity="0.85" result="color" />
                                            <feComposite operator="in" in="color" in2="inverse" result="shadow" />

                                            {/* Inner highlight effect - more subtle than before */}
                                            <feOffset dx="-1" dy="-1" />
                                            <feGaussianBlur stdDeviation="0.8" result="highlight-blur" />
                                            <feComposite operator="out" in="SourceGraphic" in2="highlight-blur" result="inverse2" />
                                            <feFlood floodColor="#ffffff" floodOpacity="0.4" result="highlight-color" />
                                            <feComposite operator="in" in="highlight-color" in2="inverse2" result="highlight" />

                                            {/* Combine inner shadow and highlight */}
                                            <feComposite operator="over" in="shadow" in2="highlight" result="combined-shadow" />
                                            <feComposite operator="over" in="combined-shadow" in2="SourceGraphic" />

                                            {/* Add subtle border effect that remains visible when pressed */}
                                            <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="thickened"/>
                                            <feFlood flood-color="#e0dbd6" flood-opacity="0.7" result="border-color"/>
                                            <feComposite in="border-color" in2="thickened" operator="in" result="border"/>
                                            <feComposite in="border" in2="SourceGraphic" operator="over"/>
                                        </filter>

                                        {/* Hover effect filter */}
                                        <filter id={`hover-glow-${baseNote % 12}`}>
                                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                                            <feFlood floodColor="#ffffff" floodOpacity="0.3" result="glow-color" />
                                            <feComposite operator="in" in="glow-color" in2="blur" result="soft-glow" />
                                            <feComposite operator="over" in="soft-glow" in2="SourceGraphic" />
                                        </filter>
                                    </React.Fragment>
                                ))}
                            </defs>

                            {/* Add a transform group to position the keys properly within the container */}
                            <g transform="translate(30, 25) scale(1.05)">
                                {/* Render each key with the organic shapes from Figma */}
                                {notes.map(({note, baseNote}) => {
                                    const keyData = KEY_DATA[baseNote];
                                    if (!keyData) return null;
                                    
                                    return (
                                        <TunableKey
                                            key={note}
                                            note={note}
                                            isPressed={activeNotes.includes(note)}
                                            tuning={useSelector((state: RootState) =>
                                                selectParameter(state, note, 'tuning'))}
                                            onNoteOn={handleNoteOn}
                                            onNoteOff={handleNoteOff}
                                            onTuningChange={handleTuningChange}
                                            mode={currentMode}
                                            onPanelClick={handlePanelClick}
                                            isPanelVisible={isPanelVisible}
                                            trackColor={currentTrackColor}
                                            pathData={keyData.path}
                                            noteName={keyData.noteName}
                                            keyLabel={keyData.keyLabel}
                                        />
                                    );
                                })}
                            </g>
                        </svg>
                    </div>

                    {/* Waveform buttons moved outside the SVG */}
                    {currentMode === 'tunable' && (
                        <div className="flex justify-center gap-3 mt-4">
                            {(['sine', 'square', 'sawtooth', 'triangle'] as const).map((waveform) => (
                                <button
                                    key={waveform}
                                    onClick={() => handleWaveformChange(waveform as Waveform)}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm
                                        transition-all duration-300 ease-in-out
                                        ${currentWaveform === waveform
                                        ? 'bg-[#e8e4dc] shadow-lg scale-105'
                                        : 'bg-[#f0ece6] opacity-70 scale-100'
                                    }
                                        text-[#4a4543]
                                        hover:opacity-90
                                    `}
                                    style={{
                                        boxShadow: currentWaveform === waveform
                                            ? '3px 3px 6px #d1cdc4, -3px -3px 6px #ffffff'
                                            : 'none'
                                    }}
                                >
                                    {waveformLabels[waveform as Waveform]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default TunableKeyboard;