import { GenericViewEdge } from "../ViewBaseTypes/GenericViewEdge";
import type { GraphNode } from "./GraphNode"

export interface GraphEdge {
    id: string;
    source: GraphNode;
    target: GraphNode;
    obj: GenericViewEdge
}
