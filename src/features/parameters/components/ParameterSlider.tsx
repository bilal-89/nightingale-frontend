import { getMutedColor } from '../../../shared/constants/colors';

// When rendering the slider
const sliderColor = props.trackColor ? getMutedColor(props.trackColor) : 'rgba(181,209,107,0.64)';

// Use sliderColor in the component
<div 
    className="slider-track"
    style={{
        background: sliderColor,
        // other styles...
    }}
>