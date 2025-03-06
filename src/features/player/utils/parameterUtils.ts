// Helper functions for parameter handling

export const isNoteProperty = (parameterId: string): boolean => {
  const noteProperties = ['velocity', 'duration', 'tuning'];
  return noteProperties.includes(parameterId);
};

export const isEnvelopeParam = (parameterId: string): boolean => {
  const envelopeParams = ['attack', 'decay', 'sustain', 'release'];
  return envelopeParams.includes(parameterId);
};

export const isUnisonParam = (parameterId: string): boolean => {
  const unisonParams = ['unisonCount', 'unisonDetune', 'unisonWidth'];
  return unisonParams.includes(parameterId);
};

export const mapUnisonParamToProperty = (parameterId: string): string | null => {
  const mapping: Record<string, string> = {
    'unisonCount': 'count',
    'unisonDetune': 'detune',
    'unisonWidth': 'width'
  };
  
  return mapping[parameterId] || null;
}; 