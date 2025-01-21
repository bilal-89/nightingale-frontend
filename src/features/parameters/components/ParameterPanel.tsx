import React, { useCallback, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectParameter, setKeyParameter } from '../../../store/slices/keyboard/keyboard.slice';

const parameterGroups = [
    {
        parameters: [
            {
                id: 'tuning',
                name: 'Tune',
                min: -100,
                max: 100,
                step: 1,
                unit: 'cents',
                defaultValue: 0,
            },
            {
                id: 'velocity',
                name: 'Vel',
                min: 0,
                max: 127,
                step: 1,
                defaultValue: 100,
            }
        ]
    }
];

const VerticalSlider = ({
                            param,
                            value,
                            onChange
                        }: {
    param: { id: string; min: number; max: number; step: number; name: string; unit?: string; defaultValue: number; };
    value: number;
    onChange: (value: number) => void;
}) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const percentage = ((value - param.min) / (param.max - param.min) * 100);

    const handleMove = useCallback((clientY: number) => {
        if (!sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const height = rect.height;
        const y = clientY - rect.top;
        const percentage = 1 - (Math.min(Math.max(y, 0), height) / height);
        const newValue = param.min + percentage * (param.max - param.min);
        const steppedValue = Math.round(newValue / param.step) * param.step;

        onChange(Math.min(Math.max(steppedValue, param.min), param.max));
    }, [param, onChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        handleMove(e.clientY);

        const handleMouseMove = (e: MouseEvent) => {
            handleMove(e.clientY);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            ref={sliderRef}
            className="relative w-4 h-[200px] bg-[#e5e9ec] rounded-full cursor-pointer"
            style={{
                boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
            }}
            onClick={(e) => handleMove(e.clientY)}
        >
            {/* Fill track */}
            <div
                className="absolute bottom-0 left-0 w-full rounded-full bg-blue-500 transition-all duration-100"
                style={{
                    height: `${percentage}%`,
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                }}
            />

            {/* Draggable thumb */}
            <div
                className={`absolute left-1/2 w-6 h-6 -ml-3 bg-white rounded-full cursor-grab
                           ${isDragging ? 'cursor-grabbing' : ''}`}
                style={{
                    bottom: `calc(${percentage}% - 12px)`,
                    boxShadow: '2px 2px 4px #c8ccd0, -2px -2px 4px #ffffff',
                    transition: isDragging ? 'none' : 'bottom 0.1s ease-out',
                    transform: 'translateX(-1px)'
                }}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
};

const ParameterPanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const selectedKey = useAppSelector(state => state.keyboard.selectedKey);
    const parameterValues = useAppSelector(state => {
        if (selectedKey === null) return {};
        return parameterGroups.reduce((values, group) => {
            group.parameters.forEach(param => {
                values[param.id] = selectParameter(state, selectedKey, param.id as any);
            });
            return values;
        }, {} as Record<string, number>);
    });

    const formatValue = (value: number, unit?: string, step?: number) => {
        const formatted = step && step < 1
            ? value.toFixed(1)
            : Math.round(value).toString();
        return unit ? `${formatted}${unit}` : formatted;
    };

    const handleParameterChange = (parameterId: string, value: number) => {
        if (selectedKey !== null) {
            dispatch(setKeyParameter({
                keyNumber: selectedKey,
                parameter: parameterId as any,
                value
            }));
        }
    };

    if (selectedKey === null) return null;

    return (
        <div className="h-[300px] px-2 py-4 bg-[#e5e9ec] rounded-3xl flex flex-row gap-3"
             style={{
                 boxShadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff'
             }}>
            {parameterGroups[0].parameters.map(param => (
                <div key={param.id}
                     className="flex flex-col items-center gap-2">
                    <div className="text-xs font-medium text-gray-600 min-w-[20px] text-center">
                        {param.name}
                    </div>

                    <div className="text-xs text-gray-500 tabular-nums mb-1 min-h-[16px]">
                        {formatValue(
                            parameterValues[param.id] ?? param.defaultValue,
                            param.unit,
                            param.step
                        )}
                    </div>

                    <VerticalSlider
                        param={param}
                        value={parameterValues[param.id] ?? param.defaultValue}
                        onChange={(value) => handleParameterChange(param.id, value)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ParameterPanel;