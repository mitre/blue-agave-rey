import { GenericViewNode } from "./GenericViewNode";
import { GenericViewItem } from "./GenericViewItem";

export abstract class GenericViewEdge extends GenericViewItem {
    
    public source: GenericViewNode;
    public target: GenericViewNode;
    public length: number;

    /**
     * Creates a new GenericViewEdge.
     * @param id
     *  The id of the edge.
     * @param source
     *  The edge's source node.
     * @param target
     *  The edge's target node.
     * @param length
     *  The edge's length.
     * @param time
     *  The time the edge occurred. 
     * @param attrs
     *  The edge's attributes.
     * @param style
     *  The edge's visual attributes.
     */
    constructor(
        id: string, 
        source: GenericViewNode, 
        target: GenericViewNode,
        length: number,
        time: Date, 
        attrs: number,
        style: number
    ) {
        super(id, time, attrs, style);
        this.source = source;
        this.target = target;
        this.length = length;
    } 

    /**
     * Returns true if the source node's critical features match the target
     * node's critical features (by value), false otherwise. If no critical
     * features are specified then they will all "match" (and return true).
     * @param criticalFeatures
     *  The set of critical features that must match (by value).
     *  (Default: [])
     * @returns
     *  True if the node's critical features match (strong edge), false
     *  otherwise (weak edge).
     */
    public isStrongEdge(criticalFeatures: string[] = []): boolean {
        let isCompleteMatch = true;
        let srcFeatures = this.source.features;
        let dstFeatures = this.target.features;
        for(let f of criticalFeatures) {
            isCompleteMatch = isCompleteMatch && srcFeatures[f] === dstFeatures[f];
        }
        return isCompleteMatch;
    }

}
