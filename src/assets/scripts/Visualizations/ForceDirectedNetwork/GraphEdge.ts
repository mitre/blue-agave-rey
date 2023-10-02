import { GraphNode } from "./GraphNode"
import { GenericViewEdge } from "../ViewBaseTypes/GenericViewEdge";

export interface GraphEdge {
    id: string;
    source: GraphNode;
    target: GraphNode;
    obj: GenericViewEdge
}
