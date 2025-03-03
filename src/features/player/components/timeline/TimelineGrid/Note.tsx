import { getMutedColor } from '../../../../../shared/constants/colors';

// When rendering the note
const noteColor = getMutedColor(color);

// Use noteColor instead of color directly
<div 
    className="absolute rounded-sm cursor-pointer"
    style={{
        backgroundColor: noteColor,
        // other styles...
    }}
> 