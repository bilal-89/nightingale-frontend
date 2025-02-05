import { BiquadFilterType } from '../types';

interface AudioRoute {
    id: string;
    sourceNode: AudioNode;
    destinationNode: AudioNode;
    effectNodes: AudioNode[];
}

export class RoutingService {
    private context: AudioContext;
    private mainOutput: GainNode;
    private routes: Map<string, AudioRoute>;

    constructor(context: AudioContext) {
        this.context = context;
        this.mainOutput = this.context.createGain();
        this.mainOutput.connect(this.context.destination);
        this.routes = new Map();
    }

    createRoute(sourceNode: AudioNode, effectConfig?: {
        filter?: {
            type: BiquadFilterType;
            frequency: number;
            Q: number;
        }
    }): string {
        const routeId = crypto.randomUUID();
        const effectNodes: AudioNode[] = [];

        if (effectConfig?.filter) {
            const filterNode = this.context.createBiquadFilter();
            filterNode.type = effectConfig.filter.type;
            filterNode.frequency.value = effectConfig.filter.frequency;
            filterNode.Q.value = effectConfig.filter.Q;
            effectNodes.push(filterNode);
        }

        const route: AudioRoute = {
            id: routeId,
            sourceNode,
            destinationNode: this.mainOutput,
            effectNodes
        };
        this.routes.set(routeId, route);

        this.connectRoute(route);

        return routeId;
    }

    cleanup(): void {
        this.routes.forEach(route => {
            this.disconnectRoute(route);
        });
        this.routes.clear();
        this.mainOutput.disconnect();
    }

    private connectRoute(route: AudioRoute): void {
        if (route.effectNodes.length > 0) {
            route.sourceNode.connect(route.effectNodes[0]);
            for (let i = 0; i < route.effectNodes.length - 1; i++) {
                route.effectNodes[i].connect(route.effectNodes[i + 1]);
            }
            route.effectNodes[route.effectNodes.length - 1].connect(route.destinationNode);
        } else {
            route.sourceNode.connect(route.destinationNode);
        }
    }

    private disconnectRoute(route: AudioRoute): void {
        route.sourceNode.disconnect();
        route.effectNodes.forEach(node => node.disconnect());
    }
}
