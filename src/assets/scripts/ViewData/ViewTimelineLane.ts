import type { ActivitySetCommonNode } from "./ViewNode";
import { 
    GenericTimelineLane, 
    type IGenericTimelineTrack
} from "../Visualizations/ViewBaseTypes/GenericTimelineLane";

export class ActivitySetTimelineLane extends GenericTimelineLane {

    public tracks: ActivitySetTimelineTrack[];
    
    /**
     * Creates a new ActivitySetTimelineLane.
     * @param id
     *  The id of the lane.
     * @param tracks
     *  The tracks that make up the lane.
     */
    constructor(id: string, tracks: ActivitySetTimelineTrack[]) {
        super(id, tracks);
        this.tracks = tracks;
    }

}

export interface ActivitySetTimelineTrack extends IGenericTimelineTrack {
    nodes: ActivitySetCommonNode[]
}
