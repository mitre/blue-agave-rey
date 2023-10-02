import { GenericViewNode } from "./GenericViewNode";
import { Focus, Visibility, VisibilityMask } from "./GeneralAttributes";

export abstract class GenericTimelineLane {

    public id: string;
    public time: Date;
    public attrs: number;
    public tracks: IGenericTimelineTrack[];

    /**
     * Creates a new GenericTimelineLane.
     * @param id
     *  The id of the lane.
     * @param tracks
     *  The node tracks that make up the lane.
     */
    constructor(id: string, tracks: IGenericTimelineTrack[]) {
        // Set lane state
        this.id = id;
        this.attrs = Visibility.Visible;
        this.tracks = tracks;
        // Set the lane's start time
        let time = Infinity;
        for(let track of tracks) {
            for(let node of track.nodes) {
                time = Math.min(time, node.time.getTime())
            }
        }
        this.time = new Date(time)
    }

    /**
     * Sets the lane's visibility.
     * @param select
     *  The visibility state.
     * @param noFocusFlag
     *  The focus mask to use when applying the focus state to the lane's
     *  nodes.
     */
    public setVisibility(visibility: number, noFocusFlag: number) {
        this.attrs = (this.attrs & ~VisibilityMask) | visibility; 
        let focus = this.isVisible() ? Focus.Focus : noFocusFlag;
        for(let track of this.tracks) {
            for(let n of track.nodes) {
                n.setFocus(noFocusFlag, focus);
                n.prev.forEach(e => e.setFocus(noFocusFlag, focus));
            }
        }
    }

    /**
     * Returns true if the lane is visible, false otherwise.
     * @returns
     *  True if the lane is visible, false otherwise.
     */
    public isVisible(): boolean {
        return (this.attrs & VisibilityMask) === Visibility.Visible;
    }

}

export interface IGenericTimelineTrack {
    nodes: GenericViewNode[];
    height: number;
}
