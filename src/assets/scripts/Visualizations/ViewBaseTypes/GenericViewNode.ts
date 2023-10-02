import { Primitive } from "@/assets/scripts/HelperTypes";
import { computeHash } from "@/assets/scripts/String";
import { GenericViewEdge } from "./GenericViewEdge";
import { GenericViewItem } from "./GenericViewItem";

export type FeatureSet = { [key: string]: Primitive }

export abstract class GenericViewNode extends GenericViewItem {

    public next: GenericViewEdge[];
    public prev: GenericViewEdge[];
    private _label: string;
    private _labelHash: number;
    public features: FeatureSet;

    /**
     * Creates a new GenericViewNode.
     * @param id
     *  The node's id.
     * @param time
     *  The time the node occurred. 
     * @param attrs
     *  The node's attributes.
     * @param style
     *  The node's visual attributes.
     * @param label
     *  The node's text label.
     * @param features
     *  The node's application-specific features.
     */
    constructor(
        id: string,
        time: Date,
        attrs: number,
        style: number,
        label: string,
        features: FeatureSet
    ) {
        super(id, time, attrs, style);
        this.next = [];
        this.prev = [];
        this._label = label;
        this._labelHash = computeHash(label);
        this.features = features;
    }

    /**
     * Sets the node's label.
     * @param label
     *  The node's label.
     */
    public setLabel(label: string) {
        this._label = label;
        this._labelHash = computeHash(label);
    }

    /**
     * Gets the node's label.
     * @returns
     *  The node's label.
     */
    public getLabel(): string {
        return this._label;
    }

    /**
     * Gets the node label's hash.
     * @returns
     *  The node label's hash.
     */
    public getLabelHash(): number {
        return this._labelHash;
    }

    /**
     * Returns true if this node is a root node, false otherwise.
     * @param criticalFeatures
     *  The set of features that must match (by value) in order for two nodes
     *  to be considered strongly connected. If no features are specified, all
     *  nodes are assumed to be strongly connected.
     *  (Default: [])
     * @returns
     *  True if this node is a root node, false otherwise.
     */
    public isRoot(criticalFeatures: string[] = []): boolean {
        if (this.prev.length === 0)
            return true;
        for (let e of this.prev) {
            // If there is at least one strong connection to an ancestral node
            // then this node can't be a root.
            if (this.doFeaturesMatch(e.source, criticalFeatures))
                return false;
        }
        return true;
    }

    /**
     * Returns true if the given node's critical features match this node's
     * critical features (by value), false otherwise. If no critical features
     * are specified then they will all "match" (and return true).
     * @param node
     *  The node to evaluate.
     * @param criticalFeatures
     *  The set of critical features that must match (by value).
     *  (Default: [])
     * @returns
     *  True if the node's critical features match, false otherwise.
     */
    public doFeaturesMatch(node: GenericViewNode, criticalFeatures: string[] = []): boolean {
        let isCompleteMatch = true;
        let srcFeatures = node.features;
        let dstFeatures = this.features;
        for (let f of criticalFeatures) {
            isCompleteMatch = isCompleteMatch && srcFeatures[f] === dstFeatures[f];
        }
        return isCompleteMatch;
    }

    /**
     * Returns all the nodes in the graph (including this node).
     * @param criticalFeatures
     *  The set of features that must match (by value) in order for two nodes
     *  to be considered strongly connected. If no features are specified, all
     *  nodes are assumed to be strongly connected. Nodes that are weakly
     *  connected aren't considered part of the same graph.
     *  (Default: [])
     * @returns
     *  A generator which returns all the nodes in the graph.
     */
    public *getGraph(criticalFeatures: string[] = []): Generator<GenericViewNode> {
        let queue: GenericViewNode[] = [this];
        let visited = new Set(this.id);
        while(queue.length) {
            let n = queue.shift()!;
            yield n;
            for(let edge of [...n.next, ...n.prev]) {
                if(visited.has(edge.target.id)) {
                    continue;
                }
                if(!this.doFeaturesMatch(edge.target)) {
                    // If nodes are weakly connected then
                    // they aren't part of the same graph.
                    continue;
                }
                visited.add(edge.target.id);
                queue.push(edge.target);
            }
        }
    }

}
