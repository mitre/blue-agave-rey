import { GenericViewEdge } from "../Visualizations/ViewBaseTypes/GenericViewEdge";
import { 
    Focus, FocusMask, 
    Select, SelectMask 
} from "../Visualizations/ViewBaseTypes/GeneralAttributes";
import { 
    EdgeType, EdgeTypeMask, 
    ActionType, ActionTypeMask
} from "./ExtendedAttributes";
import { 
    LinkStyle,
    FillColor, FillColorMask, 
    Stroke1Color, Stroke1ColorMask
} from "../Visualizations/VisualAttributes";
import type { ActivitySetEdge } from "./ActivitySetFileTypes";
import type { ActivitySetCommonNode } from "./ViewNode";


///////////////////////////////////////////////////////////////////////////////
//  1. ActivitySetViewEdge  ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export abstract class ActivitySetViewEdge<T> extends GenericViewEdge {
    
    public id: string;
    public source: ActivitySetCommonNode;
    public target: ActivitySetCommonNode;
    public data: T;

    /**
     * Creates a new ActivitySetViewEdge.
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
     * @param data
     *  The edge's Activity Set data.
     */
    constructor(
        id: string, 
        source: ActivitySetCommonNode,
        target: ActivitySetCommonNode,
        length: number,
        time: Date,
        attrs: number,
        style: number,
        data: T
    ) {
        super(id, source, target, length, time, attrs, style);
        this.id = id;
        this.source = source;
        this.target = target;
        this.data = data;
    }

    /**
     * Computes the edges's visual attributes.
     * @returns
     *  The edge's visual attributes.
     */
    public computeVisualAttributes(): number {
        let style = 0;
        let ColorMask = FillColorMask | Stroke1ColorMask;
        // Map edge type to link style and color
        switch(this.attrs & EdgeTypeMask) {
            case EdgeType.NonCausal:
                style |= LinkStyle.Line | FillColor.Orange | Stroke1Color.Orange;
                break;
            case EdgeType.Analytic:
                style |= LinkStyle.Line | FillColor.Red | Stroke1Color.Red;
                break;
            default:
                style |= LinkStyle.Arrow | FillColor.Gray | Stroke1Color.Gray;
                break;
        }
        // Map focus to color
        let colorless = (style & ~ColorMask);
        switch(this.attrs & FocusMask) {
            default:
                style = colorless | FillColor.DarkGray | Stroke1Color.DarkGray;
                break;
            case Focus.Focus:
                break;
        }
        // Map select to color
        switch(this.attrs & SelectMask) {
            case Select.Single:
                style = colorless | FillColor.DeepBlue | Stroke1Color.DeepBlue;
                break;
            case Select.Multi:
                style = colorless | FillColor.DeepGreen | Stroke1Color.DeepGreen;
                break;
        }
        return style;
    }

}


///////////////////////////////////////////////////////////////////////////////
//  2. ActivitySetPlainEdge  //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class ActivitySetPlainEdge extends ActivitySetViewEdge<ActivitySetEdge> {

    /**
     * Creates a new ActivitySetPlainEdge.
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
     * @param data
     *  The edge's Activity Set data.
     */
    constructor(
        id: string, 
        source: ActivitySetCommonNode, 
        target: ActivitySetCommonNode,
        length: number,
        time: Date,
        data: ActivitySetEdge
    ) {
        super(id, source, target, length, time, 0, 0, data);
        // Update type
        this.attrs = this.getEdgeType();
        // Update visual attributes
        this.style = this.computeVisualAttributes();
    }

    /**
     * Derives the edge's type based on its data.
     * @returns
     *  The edge's type.
     */
    private getEdgeType(): number { 
        let isSrcAccess = (this.source.attrs & ActionTypeMask) === ActionType.Access;
        return isSrcAccess ? EdgeType.NonCausal : EdgeType.Causal
    }

}


///////////////////////////////////////////////////////////////////////////////
//  3. ActivitySetAnalyticEdge  ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class ActivitySetAnalyticEdge extends ActivitySetViewEdge<{}> {

    /**
     * Creates a new ActivitySetAnalyticEdge.
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
     */
    constructor(
        id: string, 
        source: ActivitySetCommonNode, 
        target: ActivitySetCommonNode, 
        length: number,
        time: Date
    ) {
        super(id, source, target, length, time, EdgeType.Analytic, 0, {});
        // Update visual attributes
        this.style = this.computeVisualAttributes();
    }
    
}


///////////////////////////////////////////////////////////////////////////////
//  4. ActivitySetCommonEdge  /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export type ActivitySetCommonEdge = ActivitySetViewEdge<ActivitySetEdge | {}>
