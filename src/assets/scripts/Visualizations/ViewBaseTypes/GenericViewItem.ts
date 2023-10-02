import { IChronologicalEvent } from "../../Collections/IChronologicalEvent";
import { SelectMask, IsCollapsed, IsCollapsedMask, VisibilityMask, Select } from "./GeneralAttributes";

export abstract class GenericViewItem implements IChronologicalEvent {

    public id: string;
    public time: Date;
    public attrs: number;
    public style: number;

    /**
     * Creates a new GenericViewItem.
     * @param id
     *  The item's id.
     * @param time
     *  The time the item occurred. 
     * @param attrs
     *  The item's attributes.
     * @param style
     *  The items's visual attributes.
     */
    constructor(id: string, time: Date, attrs: number, style: number) {
        this.id = id;
        this.time = time;
        this.attrs = attrs;
        this.style = style;
    }

    /**
     * Returns true if the item is selected, false otherwise.
     * @returns
     *  True if the item is selected, false otherwise.
     */
    public isSelected(): boolean {
        return (this.attrs & SelectMask) !== Select.Unselected;
    }

    /**
     * Returns true if the item is collapsed, false otherwise.
     * @returns
     *  True if the item is collapsed, false otherwise.
     */
    public isCollapsed(): boolean {
        return (this.attrs & IsCollapsedMask) === IsCollapsed.True;
    }

    /**
     * Sets the item's visibility attribute and recomputes the item's visual
     * attributes.
     * @param select
     *  The visibility state.
     */
    public setVisibility(visibility: number) {
        this.attrs = (this.attrs & ~VisibilityMask) | visibility;
        this.style = this.computeVisualAttributes();
    }

    /**
     * Sets the item's selection attribute and recomputes the item's visual
     * attributes.
     * @param select
     *  The selection state.
     */
    public setSelection(select: number) {
        this.attrs = (this.attrs & ~SelectMask) | select;
        this.style = this.computeVisualAttributes();
    }

    /**
     * Sets the item's collapsed attribute and recomputes the item's visual
     * attributes.
     * @param select
     *  The collapsed state.
     */
    public setCollapsed(collapsed: number) {
        this.attrs = (this.attrs & ~IsCollapsedMask) | collapsed;
        this.style = this.computeVisualAttributes();
    }

    /**
     * Sets the item's focus attribute and recomputes the item's visual
     * attributes.
     * @param mask
     *  The focus mask to use when applying the focus state.
     * @param focus
     *  The focus state.
     */
    public setFocus(mask: number, focus: number) {
        this.attrs = (this.attrs & ~mask) | focus;
        this.style = this.computeVisualAttributes();
    }

    /**
     * Derives the item's visual attributes.
     * @returns
     *  The item's visual attributes.
     */
    public abstract computeVisualAttributes(): number;

}
