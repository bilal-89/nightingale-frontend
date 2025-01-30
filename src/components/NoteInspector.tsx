import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "./ui/card.tsx";
import {NoteEvent} from "../types/arrangement.ts";

interface NoteInspectorProps {
    noteEvent?: {
        note: number;
        timestamp: number;
        velocity: number;
        duration?: number;
        synthesis: {
            mode: string;
            waveform: string;
            envelope: {
                attack: number;
                decay: number;
                sustain: number;
                release: number;
            };
            gain: number;
            effects: Record<string, any>;
        };
    };
    onClose: () => void;
    onUpdate: (updates: Partial<NoteEvent>) => void;
}

const NoteInspector: React.FC<NoteInspectorProps> = ({
                                                         noteEvent,
                                                         onClose,
                                                         onUpdate
                                                     }) => {
    if (!noteEvent) return null;

    const noteNameFromMidi = (midi: number) => {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const note = notes[midi % 12];
        return `${note}${octave}`;
    };

    return (
        <Card className="w-96 absolute right-4 top-4 z-50 bg-white/90 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Note: {noteNameFromMidi(noteEvent.note)}</CardTitle>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    ×
                </button>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Timing Controls */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Start Time
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            value={noteEvent.timestamp}
                            onChange={(e) => onUpdate({ timestamp: Number(e.target.value) })}
                            className="flex-1"
                        />
                        <span className="text-sm w-16 text-right">
              {(noteEvent.timestamp / 1000).toFixed(3)}s
            </span>
                    </div>
                </div>

                {/* Duration Control */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Duration
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="1"
                            max="1000"
                            value={(noteEvent.duration || 0.1) * 1000}
                            onChange={(e) => onUpdate({ duration: Number(e.target.value) / 1000 })}
                            className="flex-1"
                        />
                        <span className="text-sm w-16 text-right">
              {noteEvent.duration?.toFixed(3) || '0.100'}s
            </span>
                    </div>
                </div>

                {/* Velocity Control */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Velocity
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="1"
                            max="127"
                            value={noteEvent.velocity}
                            onChange={(e) => onUpdate({ velocity: Number(e.target.value) })}
                            className="flex-1"
                        />
                        <span className="text-sm w-16 text-right">
              {noteEvent.velocity}
            </span>
                    </div>
                </div>

                {/* Synthesis Parameters */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Synthesis</h3>

                    {/* Envelope Controls */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs">Attack</label>
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                value={noteEvent.synthesis.envelope.attack * 1000}
                                onChange={(e) => onUpdate({
                                    synthesis: {
                                        ...noteEvent.synthesis,
                                        envelope: {
                                            ...noteEvent.synthesis.envelope,
                                            attack: Number(e.target.value) / 1000
                                        }
                                    }
                                })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs">Decay</label>
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                value={noteEvent.synthesis.envelope.decay * 1000}
                                onChange={(e) => onUpdate({
                                    synthesis: {
                                        ...noteEvent.synthesis,
                                        envelope: {
                                            ...noteEvent.synthesis.envelope,
                                            decay: Number(e.target.value) / 1000
                                        }
                                    }
                                })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs">Sustain</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={noteEvent.synthesis.envelope.sustain * 100}
                                onChange={(e) => onUpdate({
                                    synthesis: {
                                        ...noteEvent.synthesis,
                                        envelope: {
                                            ...noteEvent.synthesis.envelope,
                                            sustain: Number(e.target.value) / 100
                                        }
                                    }
                                })}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs">Release</label>
                            <input
                                type="range"
                                min="0"
                                max="1000"
                                value={noteEvent.synthesis.envelope.release * 1000}
                                onChange={(e) => onUpdate({
                                    synthesis: {
                                        ...noteEvent.synthesis,
                                        envelope: {
                                            ...noteEvent.synthesis.envelope,
                                            release: Number(e.target.value) / 1000
                                        }
                                    }
                                })}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Gain Control */}
                    <div>
                        <label className="text-xs">Gain</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={noteEvent.synthesis.gain * 100}
                                onChange={(e) => onUpdate({
                                    synthesis: {
                                        ...noteEvent.synthesis,
                                        gain: Number(e.target.value) / 100
                                    }
                                })}
                                className="flex-1"
                            />
                            <span className="text-xs w-12 text-right">
                {(noteEvent.synthesis.gain * 100).toFixed(0)}%
              </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default NoteInspector;