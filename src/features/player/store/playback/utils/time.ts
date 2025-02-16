export const percentToMs = (percent: number, totalDuration: number) => {
    return Math.floor(percent * totalDuration);
};

export const msToPercent = (ms: number, totalDuration: number) => {
    return ms / totalDuration;
};
