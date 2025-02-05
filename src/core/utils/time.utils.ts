import { TIME_CONFIG } from "../config/constants";
import { TimelinePosition, MusicalTime } from "../types/time";

export function ticksToMs(ticks: number, bpm: number): number {
    // Convert musical ticks to real-time milliseconds based on tempo
    const msPerTick = (60000 / bpm) / TIME_CONFIG.TICKS_PER_BEAT;
    return ticks * msPerTick;
}

export function msToTicks(ms: number, bpm: number): number {
    // Convert real-time milliseconds back to musical ticks
    const ticksPerMs = (TIME_CONFIG.TICKS_PER_BEAT * bpm) / 60000;
    return Math.round(ms * ticksPerMs);
}

export function positionToTicks(position: TimelinePosition): number {
    // Convert a musical position (bars, beats, etc.) to a total tick count
    return position.bar * TIME_CONFIG.TICKS_PER_BEAT * 4 +
           position.beat * TIME_CONFIG.TICKS_PER_BEAT +
           position.sixteenth * (TIME_CONFIG.TICKS_PER_BEAT / 4) +
           position.ticks;
}
