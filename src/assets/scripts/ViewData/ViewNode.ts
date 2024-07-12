import { GenericViewNode, type FeatureSet } from "../Visualizations/ViewBaseTypes/GenericViewNode";
import { 
    CarTypeMask,
    ObjectType, ObjectTypeMask, ObjectTypeString,
    ActionType, ActionTypeMask, ActionTypeString, 
    HasAnalyticsHidden, HasAnalyticsHiddenMask
} from "./ExtendedAttributes";
import { 
    Focus, FocusMask,
    Select, SelectMask,
    IsCollapsed, IsCollapsedMask  
} from "../Visualizations/ViewBaseTypes/GeneralAttributes";
import {
    FillColor,
    Stroke2Color,
    Stroke2Width,
    Size, SizeMask, 
    Shape, ShapeMask,
    Dimmed, DimmedMask,
    Stroke1Width, Stroke1WidthMask,
    Stroke1Color, Stroke1ColorMask
} from "../Visualizations/VisualAttributes";
import type { ActivitySetCommonEdge } from "./ViewEdge"
import type { ActivitySetEvent, ActivitySetAnalytic } from "./ActivitySetFileTypes";


///////////////////////////////////////////////////////////////////////////////
//  1. ActivitySetViewNode  ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export abstract class ActivitySetViewNode<T> extends GenericViewNode {

    public next: ActivitySetCommonEdge[] = [];
    public prev: ActivitySetCommonEdge[] = [];
    public set: string;
    public data: T;

    /**
     * The node label's max character length.
     */
    private static MAX_LABEL_LENGTH: number = 20;

    /**
     * Creates a new ActivitySetViewNode.
     * @param id
     *  The node's id.
     * @param time
     *  The time the node occurred. 
     * @param attrs
     *  The node's attributes.
     * @param style
     *  The node's visual attributes.
     * @param label
     *  The node's label text.
     * @param features
     *  The node's application features.
     * @param set
     *  The nodes's Activity Set id.
     * @param data
     *  The node's Activity Set data.
     */
    constructor(
        id: string, 
        time: Date, 
        attrs: number,
        style: number,
        label: string,
        features: FeatureSet,
        set: string,
        data: T
    ) {
        super(id, time, attrs, style, label, features);
        this.set = set;
        this.data = data;
    }

    /**
     * Returns true if the node is an analytic-type node, false otherwise.
     * @returns 
     *  True if the node is an analytic-type node, false otherwise.
     */
    public isAnalytic(): boolean {
        return (this.attrs & ObjectTypeMask) === ObjectType.Analytic;
    }

    /**
     * Returns true if the node has an analytic-type node attached, false 
     * otherwise.
     * @returns
     *  True if the node has an analytic-type node attached, false otherwise.
     */
    public hasAnalytic(): boolean {
        for(let edge of this.next) {
            if(edge.target.isAnalytic())
                return true;
        }
        return false;
    }

    /**
     * Returns the node's object type as a string.
     * @returns
     *  The node's object type as a string.
     */
    public getObjectTypeString(): string {
        return ObjectTypeString[this.attrs & ObjectTypeMask];
    }

    /**
     * Returns the node's action type as a string.
     * @returns
     *  The node's action type as a string.
     */
    public getActionTypeString(): string {
        return ActionTypeString[this.attrs & ActionTypeMask]
    }

    /**
     * Computes the node's visual attributes.
     * @returns
     *  The node's visual attributes.
     */
    public computeVisualAttributes(): number {
        let style = 0;
        // Map dimmed to focus
        switch(this.attrs & FocusMask) {
            case Focus.Focus:
                style |= Dimmed.False;
                break;
            default:
                style |= Dimmed.True;
                break;
        }
        // Map stroke 2 and dimmed to selected state
        switch(this.attrs & SelectMask) {
            case Select.Single:
                style |= Stroke2Color.DeepBlue | Stroke2Width.L;
                style = (style & ~DimmedMask) | Dimmed.False;
                break;
            case Select.Multi:
                style |= Stroke2Color.DeepGreen | Stroke2Width.L;
                style = (style & ~DimmedMask) | Dimmed.False;
                break;
        }
        // Map color to action
        switch(this.attrs & ActionTypeMask) {
            case ActionType.Analytic:
                style |= FillColor.Red | Stroke1Color.Red;
                break;
            case ActionType.Create:
                style |= FillColor.Blue | Stroke1Color.Blue;
                break;
            case ActionType.Access:
                style |= FillColor.Orange | Stroke1Color.Orange;
                break;
            case ActionType.Terminate:
                style |= FillColor.Gray | Stroke1Color.Gray;
                break;
            case ActionType.Connect:
                style |= FillColor.Green | Stroke1Color.Green;
                break;
            case ActionType.Load:
                style |= FillColor.Purple | Stroke1Color.Purple;
                break;
            case ActionType.Unknown:
                style |= FillColor.Gray | Stroke1Color.Gray;
                break;
        }
        // Map shape and size to object
        switch(this.attrs & ObjectTypeMask) {
            case ObjectType.Process:
                style |= Shape.Circle | Size.L;
                break;
            case ObjectType.Flow:
                style |= Shape.Rhombus | Size.L;
                break;
            case ObjectType.Module:
                style |= Shape.Hexagon | Size.S;
                break;
            case ObjectType.File:
                style |= Shape.Square | Size.M;
                break;
            case ObjectType.Registry:
                style |= Shape.Triangle | Size.S;
                break;
            case ObjectType.PowerShell:
                style |= Shape.Circle | Size.S;
                break;
            case ObjectType.Analytic:
                style |= Shape.Circle | Size.L;
                break;
            case ObjectType.Unknown:
                style |= Shape.Circle | Size.L;
                break;
        }
        // Map shape and size to special car types
        switch(this.attrs & CarTypeMask) {
            case ObjectType.Process | ActionType.Access:
                style = (style & ~(ShapeMask | SizeMask)) | Shape.Circle | Size.S;
                break;
            case ObjectType.Process | ActionType.Terminate:
                style = (style & ~(ShapeMask | SizeMask)) | Shape.Circle | Size.M;
                break;
        }
        // Map stroke 1 width and size to collapsed state
        switch(this.attrs & IsCollapsedMask) {
            case IsCollapsed.False:
                style |= Stroke1Width.S;
                break;
            case IsCollapsed.True:
                style |= Stroke1Width.L;
                style = (style & ~SizeMask) | Size.XL;
                break;
        }
        // Map stroke 1 width and color to has-analytics-hidden state
        switch(this.attrs & HasAnalyticsHiddenMask) {
            case HasAnalyticsHidden.True:
                style &= ~(Stroke1WidthMask | Stroke1ColorMask);
                style |= Stroke1Width.M | Stroke1Color.DarkRed; 
                break;
        }
        return style;
    }

    /**
     * Sets the node's has-analytics-hidden attribute and recomputes the node's
     * visual attributes.
     * @param hasAnalyticsHidden
     *  The has-analytics-hidden state.
     */
    public setHasAnalyticsHidden(hasAnalyticsHidden: number) {
        this.attrs = (this.attrs & ~HasAnalyticsHiddenMask) | hasAnalyticsHidden;
        this.style = this.computeVisualAttributes();
    }

    /**
     * Formats the provided arguments as a label.
     * @param labels
     *  The arguments to format.
     * @returns
     *  The formatted label.
     */
    protected formatLabel(...labels: any[]): string {
        let MAX = ActivitySetViewNode.MAX_LABEL_LENGTH;
        return labels.map(l => {
            if(l === undefined) {
                return "[ Missing Key ]";
            } else {
                l = `${ l }`;
                return l.length <= MAX ? l : `${ l.substring(0, MAX) }…`;
            }
        }).join("\n");
    }

}


///////////////////////////////////////////////////////////////////////////////
//  2. ActivitySetEventNode  //////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class ActivitySetEventNode extends ActivitySetViewNode<ActivitySetEvent> {

    /**
     * Creates a new ActivitySetEventNode.
     * @param set
     *  The event's Activity Set id.
     * @param data
     *  The event's Activity Set data.
     * @param features
     *  The event's application features.
     */
    constructor(set: string, data: ActivitySetEvent, features: Array<keyof ActivitySetEvent>) {
        super(data.event_id, data.time, 0, 0, "", {}, set, data);
        // Update CAR type
        if("event_type_id" in data){
            this.attrs = this.getNodeTypeByEventTypeId(data.event_type_id!);
        } else {
            this.attrs = this.getNodeTypeByCar(data.object, data.action);
        }
        // Update label
        this.setLabel(this.deriveLabel());
        // Configure application features
        let featureMap = new Map();
        for(let f of features) {
            featureMap.set(f, data[f]);
        }
        featureMap.set("__set", set);
        this.features = Object.fromEntries(featureMap.entries());
        // Update visual attributes
        this.style = this.computeVisualAttributes();
    }

    /**
     * Derives a CAR type from an event type id.  
     * @param eventTypeId
     *  The event type id.
     * @returns
     *  The derived CAR type.
     */
    private getNodeTypeByEventTypeId(eventTypeId: number): number {
        switch(eventTypeId) {
            case 1:
                return ObjectType.Process | ActionType.Create;
            case 3:
                return ObjectType.Flow | ActionType.Connect;
            case 5:
                return ObjectType.Process | ActionType.Terminate;
            case 7:
                return ObjectType.Module | ActionType.Load;
            case 10:
                return ObjectType.Process | ActionType.Access;
            case 11:
            case 29801:
                return ObjectType.File | ActionType.Create;
            case 13:
                return ObjectType.Registry | ActionType.Access
            case 4104:
                return ObjectType.PowerShell | ActionType.Create;
            case 4663:
                return ObjectType.File | ActionType.Access;
            default:
                return ObjectType.Unknown | ActionType.Unknown;
        }
    }

    /**
     * Parses a CAR type using the given object and action. 
     * @param object
     *  The object type.
     * @param action
     *  The action type.
     * @returns
     *  The parsed CAR type.
     */
    private getNodeTypeByCar(object: string, action: string): number {
        let type = 0;
        switch(object.toLocaleLowerCase()) {
            case "process":    type = ObjectType.Process;    break;
            case "flow":       type = ObjectType.Flow;       break;
            case "module":     type = ObjectType.Module;     break;
            case "file":       type = ObjectType.File;       break;
            case "registry":   type = ObjectType.Registry;   break;
            case "powershell": type = ObjectType.PowerShell; break;
            default:           return ObjectType.Unknown | ActionType.Unknown;
        }
        switch(action.toLocaleLowerCase()){
            case "create":    return type | ActionType.Create;
            case "start":     return type | ActionType.Connect;
            case "load":      return type | ActionType.Load;
            case "access":    return type | ActionType.Access;
            case "terminate": return type | ActionType.Terminate;
            default:          return ObjectType.Unknown | ActionType.Unknown;
        }
    }

    /**
     * Derives the node's label based on its type.
     * @returns
     *  The node's label.
     */
    private deriveLabel(): string {
        switch(this.attrs & CarTypeMask) {
        
            case ObjectType.Process | ActionType.Create:
                return this.formatLabel(
                    this.data.exe,
                    this.data.user
                );

            case ObjectType.Process | ActionType.Access:
                if(!("call_trace" in this.data))
                    return this.formatLabel(undefined);
                let callTrace = this.data.call_trace!.split("|");
                let lastElement = callTrace[callTrace.length - 1];
                let match = null;
                if((match = /(?:[^\\]+\\)+([^+]+)/.exec(lastElement)) !== null) {
                    match = match[1];
                } else if(/unknown\([0-9A-Fa-f]+\)/.test(lastElement)) {
                    match = "Unknown";
                } else {
                    match = lastElement;
                }
                return this.formatLabel(match);

            case ObjectType.Process | ActionType.Terminate:
                return this.formatLabel(this.data.exe);

            case ObjectType.Flow | ActionType.Connect:
                return this.formatLabel(
                    this.data.host, 
                    `${ this.data.dest_ip }:${ this.data.dest_port }`
                );
            
            case ObjectType.Module | ActionType.Load:
                return this.formatLabel(this.data.module_name);
            
            case ObjectType.File | ActionType.Create:
            case ObjectType.File | ActionType.Access:
                return this.formatLabel(this.data.file_name, this.data.action);
            
            case ObjectType.Registry | ActionType.Access:
                return this.formatLabel(this.data.value);
            
            case ObjectType.PowerShell | ActionType.Create:
                return this.formatLabel("SCRIPT_BLOCK", this.data.record_number);
            
            default:
                return this.formatLabel(this.data.object, this.data.action);
            
        }
    }
    
}


///////////////////////////////////////////////////////////////////////////////
//  3. ActivitySetAnalyticNode  ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class ActivitySetAnalyticNode extends ActivitySetViewNode<ActivitySetAnalytic> {

    /**
     * Creates a new ActivitySetAnalyticNode.
     * @param set
     *  The analytic's Activity Set id.
     * @param source
     *  The analytic's source event.
     * @param time
     *  The time the analytic occurred. 
     * @param data
     *  The analytics's Activity Set data.
     */
    constructor(set: string, source: ActivitySetEventNode, time: Date, data: ActivitySetAnalytic) {
        super(data.analytic_result_id, time, 0, 0, "", {}, set, data);
        // Update CAR type
        this.attrs = ObjectType.Analytic | ActionType.Analytic;
        // Update label
        this.setLabel(this.formatLabel(data.attack_tactic, data.attack_technique_id));
        // Configure application features
        this.features = { ...source.features }
        // Update visual attributes
        this.style = this.computeVisualAttributes();
    }

}


///////////////////////////////////////////////////////////////////////////////
//  4. ActivitySetCommonNode  /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export type ActivitySetCommonNode = ActivitySetViewNode<
    ActivitySetEvent | ActivitySetAnalytic
>;
