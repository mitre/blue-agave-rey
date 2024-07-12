import { computeHash } from "../../String";
import type { GraphNode } from "./GraphNode";

export class GraphCluster {
    
    public label: string;
    public labelHash: number;
    public nodes: GraphNode[]

    /**
     * Creates a new GraphCluster.
     * @param label
     *  The cluster's label.
     * @param nodes
     *  The nodes that belong to the cluster.
     */
    constructor(label: string, nodes: GraphNode[]) {
        this.label = label;
        this.labelHash = computeHash(this.label);
        this.nodes = nodes;
    }

}
