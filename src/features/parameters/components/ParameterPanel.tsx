import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectParameter, setKeyParameter } from '../../../store/slices/keyboard/keyboard.slice';

const parameterGroups = [
    {
        id: 'core',
        title: 'Core Parameters',
        parameters: [
            {
                id: 'tuning',
                name: 'Tuning',
                min: -100,
                max: 100,
                step: 1,
                unit: 'cents',
                defaultValue: 0,
                description: 'Fine-tune the pitch up or down'
            },
            {
                id: 'velocity',
                name: 'Velocity',
                min: 0,
                max: 127,
                step: 1,
                defaultValue: 100,
                description: 'Control the intensity of the note'
            }
        ]
    }
];

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
        return unit ? `${formatted} ${unit}` : formatted;
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

    return (
        <div className="w-full max-w-md p-6 bg-[#e5e9ec] dark:bg-gray-800 rounded-3xl"
             style={{
                 boxShadow: '8px 8px 16px #c8ccd0, -8px -8px 16px #ffffff'
             }}>
            {/* Header */}
            <div className="mb-6 pb-4 border-b border-gray-300 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">
                    {selectedKey !== null
                        ? `Sound Design: Key ${selectedKey}`
                        : 'Select a key to edit parameters'}
                </h2>
            </div>

            {/* Content */}
            <div className="space-y-8">
                {selectedKey !== null ? (
                    parameterGroups.map(group => (
                        <div key={group.id} className="space-y-6">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {group.title}
                            </h3>

                            <div className="space-y-6">
                                {group.parameters.map(param => (
                                    <div key={param.id}
                                         className="p-4 rounded-2xl bg-[#e5e9ec]"
                                         style={{
                                             boxShadow: 'inset 4px 4px 8px #c8ccd0, inset -4px -4px 8px #ffffff'
                                         }}>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {param.name}
                                            </label>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                                                {formatValue(
                                                    parameterValues[param.id] ?? param.defaultValue,
                                                    param.unit,
                                                    param.step
                                                )}
                                            </span>
                                        </div>

                                        {/* Custom Neumorphic Slider */}
                                        <div className="relative h-2 bg-[#e5e9ec] rounded-full mb-2"
                                             style={{
                                                 boxShadow: 'inset 2px 2px 4px #c8ccd0, inset -2px -2px 4px #ffffff'
                                             }}>
                                            <input
                                                type="range"
                                                min={param.min}
                                                max={param.max}
                                                step={param.step}
                                                value={parameterValues[param.id] ?? param.defaultValue}
                                                onChange={(e) => handleParameterChange(param.id, Number(e.target.value))}
                                                className="absolute w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="absolute h-full bg-blue-500 rounded-full"
                                                 style={{
                                                     width: `${((parameterValues[param.id] ?? param.defaultValue) - param.min) / (param.max - param.min) * 100}%`,
                                                     boxShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                                 }}
                                            />
                                            <div className="absolute w-4 h-4 bg-white rounded-full -right-2 top-1/2 transform -translate-y-1/2"
                                                 style={{
                                                     left: `${((parameterValues[param.id] ?? param.defaultValue) - param.min) / (param.max - param.min) * 100}%`,
                                                     boxShadow: '2px 2px 4px #c8ccd0, -2px -2px 4px #ffffff'
                                                 }}
                                            />
                                        </div>

                                        {param.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                                                {param.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Right-click or Shift+click a key to edit its parameters
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParameterPanel;