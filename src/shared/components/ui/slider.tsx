import * as React from "react"

interface SliderProps {
    value: number[];
    onValueChange: (value: number[]) => void;
    max?: number;
    min?: number;
    step?: number;
    className?: string;
}

export const Slider: React.FC<SliderProps> = ({
                                                  value,
                                                  onValueChange,
                                                  max = 100,
                                                  min = 0,
                                                  step = 1,
                                                  className = ""
                                              }) => {
    const percentage = ((value[0] - min) / (max - min)) * 100;

    return (
        <div className={`relative w-full h-6 ${className}`}>
            <div className="absolute w-full h-2 top-2 bg-[#d1d9e6] rounded-full shadow-[inset_2px_2px_5px_#b8bcc2,_inset_-3px_-3px_7px_#ffffff]">
                <div
                    className="absolute h-full bg-blue-500 rounded-full opacity-20"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value[0]}
                onChange={(e) => onValueChange([Number(e.target.value)])}
                className="absolute w-full h-2 top-2 opacity-0 cursor-pointer"
            />
            <div
                className="absolute w-4 h-4 bg-white rounded-full shadow-[2px_2px_5px_#b8bcc2,_-2px_-2px_5px_#ffffff] cursor-pointer"
                style={{
                    left: `calc(${percentage}% - 0.5rem)`,
                    top: "0.25rem"
                }}
            />
        </div>
    );
};