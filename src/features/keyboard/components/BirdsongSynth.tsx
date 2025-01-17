import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Slider } from '../../../components/ui/slider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { initialize, noteOn, noteOff, updateParameters } from '../../../store/slices/birdsong/birdsong.slice';
import { BirdsongParameters } from '../../../audio/context/birdsong/types';

const BirdsongSynth: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isInitialized, parameters } = useAppSelector(state => state.birdsong);

    useEffect(() => {
        const keyMap: { [key: string]: number } = {
            'a': 60,
            'w': 61,
            's': 62,
            'e': 63,
            'd': 64,
            'f': 65,
            't': 66,
            'g': 67,
            'y': 68,
            'h': 69,
            'u': 70,
            'j': 71,
            'k': 72
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const note = keyMap[e.key.toLowerCase()];
            if (note) {
                dispatch(noteOn(note));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const note = keyMap[e.key.toLowerCase()];
            if (note) {
                dispatch(noteOff(note));
            }
        };

        if (isInitialized) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isInitialized, dispatch]);

    const handleParameterChange = (param: keyof BirdsongParameters, value: number) => {
        dispatch(updateParameters({
            ...parameters,
            [param]: value / 100
        }));
    };

    return (
        <Card className="w-full bg-[#e0e5ec]">
            <CardHeader>
                <CardTitle className="text-gray-700">Birdsong Synthesizer</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {!isInitialized && (
                        <button
                            onClick={() => dispatch(initialize())}
                            className="w-full p-4 rounded-lg shadow-[5px_5px_10px_#b8bcc2,_-5px_-5px_10px_#ffffff]
                         bg-[#e0e5ec] text-gray-700 transition-all
                         active:shadow-[inset_5px_5px_10px_#b8bcc2,_inset_-5px_-5px_10px_#ffffff]"
                        >
                            Initialize Audio
                        </button>
                    )}

                    <div className="space-y-4">
                        <div className="p-6 rounded-lg shadow-[5px_5px_10px_#b8bcc2,_-5px_-5px_10px_#ffffff]">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-600 mb-2 block">Syrinx Tension</label>
                                    <Slider
                                        value={[parameters.syrinxTension * 100]}
                                        onValueChange={(value) => handleParameterChange('syrinxTension', value[0])}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 mb-2 block">Air Pressure</label>
                                    <Slider
                                        value={[parameters.airPressure * 100]}
                                        onValueChange={(value) => handleParameterChange('airPressure', value[0])}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-600 mb-2 block">Turbulence</label>
                                    <Slider
                                        value={[parameters.turbulence * 100]}
                                        onValueChange={(value) => handleParameterChange('turbulence', value[0])}
                                        max={100}
                                        step={1}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {['A', 'W', 'S', 'E', 'D', 'F', 'T', 'G', 'Y', 'H', 'U', 'J', 'K'].map((key, i) => (
                                <button
                                    key={key}
                                    className="aspect-square rounded-lg shadow-[5px_5px_10px_#b8bcc2,_-5px_-5px_10px_#ffffff]
                             bg-[#e0e5ec] text-gray-700 transition-all
                             active:shadow-[inset_5px_5px_10px_#b8bcc2,_inset_-5px_-5px_10px_#ffffff]"
                                    onMouseDown={() => dispatch(noteOn(60 + i))}
                                    onMouseUp={() => dispatch(noteOff(60 + i))}
                                    onMouseLeave={() => dispatch(noteOff(60 + i))}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default BirdsongSynth;