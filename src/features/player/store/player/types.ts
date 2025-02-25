export interface NoteEvent {
    id: string;
    note: number;
    timestamp: number;
    duration: number;
    tuning?: number; // Add tuning property (in cents)
} 