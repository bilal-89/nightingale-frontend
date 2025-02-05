import { VoiceService } from './voice.service';
import { RoutingService } from './routing.service';

export class AudioServices {
    private voiceService: VoiceService;
    private routingService: RoutingService;
    private context: AudioContext;

    constructor() {
        this.context = new AudioContext({
            latencyHint: 'interactive',
            sampleRate: 48000
        });
        this.voiceService = new VoiceService(this.context);
        this.routingService = new RoutingService(this.context);
    }

    public get voices() { return this.voiceService; }
    public get routing() { return this.routingService; }
    
    initialize(): Promise<void> {
        return this.context.resume();
    }

    cleanup(): void {
        this.voiceService.cleanup();
        this.routingService.cleanup();
        this.context.close();
    }
}

export const audioServices = new AudioServices();
