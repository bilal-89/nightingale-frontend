# Oscillator Mode Button Placement Options

Here are different options for placing the oscillator mode toggle buttons in the keyboard layout:

## Option 1: Left of Waveform Controls (Current Implementation)
```jsx
{currentMode === 'tunable' && (
    <div className="flex justify-center items-end space-x-3">
        <OscillatorModeToggle />
        <WaveformControls
            currentWaveform={currentWaveform}
            onWaveformChange={handleWaveformChange}
        />
    </div>
)}
```

## Option 2: Right of Waveform Controls
```jsx
{currentMode === 'tunable' && (
    <div className="flex justify-center items-end space-x-3">
        <WaveformControls
            currentWaveform={currentWaveform}
            onWaveformChange={handleWaveformChange}
        />
        <OscillatorModeToggle />
    </div>
)}
```

## Option 3: Above Waveform Controls
```jsx
{currentMode === 'tunable' && (
    <div className="flex flex-col items-center space-y-2">
        <OscillatorModeToggle />
        <WaveformControls
            currentWaveform={currentWaveform}
            onWaveformChange={handleWaveformChange}
        />
    </div>
)}
```

## Option 4: Below Waveform Controls
```jsx
{currentMode === 'tunable' && (
    <div className="flex flex-col items-center space-y-2">
        <WaveformControls
            currentWaveform={currentWaveform}
            onWaveformChange={handleWaveformChange}
        />
        <OscillatorModeToggle />
    </div>
)}
```

## Option 5: Near Octave Controls
```jsx
// In the section where you have octave controls:
<div className="flex items-center space-x-2">
    <OctaveControls
        currentOctave={currentOctave}
        minOctave={minOctave}
        maxOctave={maxOctave}
        setOctave={handleOctaveChange}
    />
    <OscillatorModeToggle />
</div>
```

## Option 6: Top-Right Corner of Keyboard
```jsx
{currentMode === 'tunable' && (
    <div className="relative">
        <div className="absolute top-2 right-2">
            <OscillatorModeToggle />
        </div>
        <div className="flex justify-center">
            <WaveformControls
                currentWaveform={currentWaveform}
                onWaveformChange={handleWaveformChange}
            />
        </div>
    </div>
)}
```

## Option 7: Inside a Parameter Panel
If you have a parameter panel already, you could include the oscillator mode toggle inside that panel with other controls.

To implement any of these options, replace the current implementation in `TunableKeyboard.tsx` with the chosen option. 