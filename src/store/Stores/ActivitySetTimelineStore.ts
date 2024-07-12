import Features from "@/assets/rey.features";
import { Focus, Visibility } from "@/assets/scripts/Visualizations/ViewBaseTypes/GeneralAttributes";
import { ActivitySetTimelineLane } from "@/assets/scripts/ViewData/ViewTimelineLane";
import type { Module, Store } from "vuex";
import type { ActivitySetTimelineStore, ModuleStore } from "../StoreTypes";
import type { ActivitySetCommonNode, ActivitySetEventNode } from "@/assets/scripts/ViewData/ViewNode";

export default {
    namespaced: true,
    state: {
        lanes: [],
        triggerTimelineLayout: 0
    },

    actions: {

        /**
         * Sets a lane's visibility state.
         * @param ctx
         *  The Vuex context.
         * @param visibleParams
         *  [id]
         *   The id of the lane to show / hide.
         *   `__all_lanes` to select all lanes.
         *  [value]
         *   The visibility state. (true = visible, false = hidden)
         */
        setLaneVisibility({ state, commit }, { id, value }: { id: string, value: boolean }) {
            if(id === "__all_lanes") {
                for(let lane of state.lanes)
                    commit("setLaneVisibility", { lane, value });
            } else {
                let lane = state.lanes.find(l => l.id === id);
                if(lane) commit("setLaneVisibility", { lane, value });
            }
            // Increment data focused trigger
            commit("ActivitySetsStore/incrementDataFocusedCounter", null, { root: true })
            // Increment timeline layout trigger
            commit("incrementTimelineLayoutCounter");
        },

        /**
         * [INTERNAL USE ONLY]
         * Splits all nodes in the store into a set of lanes based on the
         * current breakout feature.
         * @param ctx
         *  The Vuex context.
         */
        async _updateTimelineBreakout({ commit, dispatch, rootState }) {
            let AppStore = rootState.AppSettingsStore;
            let { key, on } = AppStore.active_timeline_breakout;
            let { stack_car_types } = AppStore.settings.view.timeline;
            let { no_analytic_lane_name: nal } = Features.activity_set_timeline;

            // Derive lanes
            type Tracks = { 
                "analytics": ActivitySetCommonNode[],
                "events": Map<string, ActivitySetCommonNode[]>
            }
            let lanes = new Map<string, Tracks>();
            let nodes = rootState.ActivitySetsStore.nodes;
            switch(on) {
                case "analytic":
                    for(let node of nodes.values() as Iterable<ActivitySetEventNode>) {
                        if(node.isAnalytic()) 
                            continue;
                        let analyticFound = false;
                        for(let next of node.next) {
                            if(!next.target.isAnalytic())
                                continue;
                            // Select analytic
                            let analytic = nodes.get(next.target.id)!;
                            let keyName = `${ (analytic.data as any)[key] }`
                            // Select lane
                            if(!lanes.has(keyName))
                                lanes.set(keyName, { analytics: [], events: new Map() });
                            let lane = lanes.get(keyName)!
                            // Add analytic to lane
                            lane.analytics.push(analytic);
                            // Add event to lane
                            let track = stack_car_types ? node.data.car_attributes : "all";
                            if(!lane.events.has(track))
                                lane.events.set(track, []);
                            if(!lane.events.get(track)!.includes(node))
                                lane.events.get(track)!.push(node);
                            // Set analytic found flag
                            analyticFound = true;
                        }
                        // If no analytic was attached to the event, push event
                        // to no_analytic_lane
                        if(!analyticFound) {
                            // Select lane
                            if(!lanes.has(nal))
                                lanes.set(nal, { analytics: [], events: new Map() });
                            let lane = lanes.get(nal)!;
                            // Add event to lane
                            let track = stack_car_types ? node.data.car_attributes : "all";
                            if(!lane.events.has(track))
                                lane.events.set(track, []);
                            if(!lane.events.get(track)!.includes(node))
                                lane.events.get(track)!.push(node);
                        }
                    }
                    break;
                case "event":
                    for(let node of nodes.values() as Iterable<ActivitySetEventNode>) {
                        if(node.isAnalytic()) 
                            continue;
                        let keyName = `${ (node.data as any)[key] }`
                        // Select lane
                        if(!lanes.has(keyName))
                            lanes.set(keyName, { analytics: [], events: new Map() });
                        let lane = lanes.get(keyName)!
                        // Add analytics to lane
                        for(let next of node.next) {
                            if(!next.target.isAnalytic()) continue;
                            // Select analytic
                            let analytic = nodes.get(next.target.id)!;
                            lane.analytics.push(analytic);
                        }
                        // Add event to lane
                        let track = stack_car_types ? node.data.car_attributes : "all";
                        if(!lane.events.has(track))
                            lane.events.set(track, []);
                        lane.events.get(track)!.push(node);
                    }
                    break;
            }

            // Compile breakout lanes
            let breakoutLanes = [];
            for(let [key, lane] of lanes) {
                // Sort nodes by time
                for(let track of [lane.analytics, ...lane.events.values()])
                    track.sort((a,b) => a.time.getTime() - b.time.getTime());
                // Compile tracks
                let tracks = [...lane.events.values()]
                    .map(nodes => ({ nodes, height: 10 }))
                    .sort((a,b) => 
                        a.nodes[0].time.getTime() -
                        b.nodes[0].time.getTime()
                    );
                tracks.unshift({ nodes: lane.analytics, height: 15 })
                // Create and add breakout lane
                breakoutLanes.push(new ActivitySetTimelineLane(key, tracks));
            }

            // Bring old lanes back into focus
            await dispatch("setLaneVisibility", { 
                id: "__all_lanes", value: true 
            });

            // Set new lanes
            commit("setBreakoutLanes", breakoutLanes);

            // Update sort
            dispatch("_updateTimelineSort");

        },

        /**
         * [INTERNAL USE ONLY]
         * Re-sorts the timeline lanes based on the current sort feature.
         * @param ctx
         *  The Vuex context.
         */
        _updateTimelineSort({ state, commit, rootState }) {
            let { id } = rootState.AppSettingsStore.active_timeline_sort;
            // Sort lanes
            let lanes = state.lanes;
            let sort: (
                a: ActivitySetTimelineLane, 
                b: ActivitySetTimelineLane
            ) => number;
            switch(id) {
                case "name":
                    sort = (a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
                    break;
                case "time":
                    sort = (a,b) => a.time.getTime() - b.time.getTime();
                    break;
            }
            lanes.sort(sort);
            // Increment timeline layout trigger
            commit("incrementTimelineLayoutCounter");
        }

    },

    mutations: {

        /**
         * Sets the current breakout lanes. 
         * @param state
         *  The Vuex state.
         * @param lanes
         *  The current set of breakout lanes. 
         */
        setBreakoutLanes(state, lanes: ActivitySetTimelineLane[]) {
            state.lanes = lanes;
        },

        /**
         * Sets a lane's visibility state.
         * @param _
         *  The Vuex state.
         * @param visibleParams
         *  [lane]
         *   The lane to show / hide.
         *  [value]
         *   The visibility state. (true = visible, false = hidden)
         */
        setLaneVisibility(_, { lane, value }: { lane: ActivitySetTimelineLane, value: boolean }) {
            let visibility = value ? Visibility.Visible : Visibility.Hidden;
            lane.setVisibility(visibility, Focus.NoFocus2);
        },

        /**
         * Increments the timeline layout trigger.
         * @param state
         *  The Vuex state.
         */
        incrementTimelineLayoutCounter(state) {
            state.triggerTimelineLayout++;
        }

    }
} as Module<ActivitySetTimelineStore, ModuleStore>


///////////////////////////////////////////////////////////////////////////////
//  Store Integrations  //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export const TimelineStoreIntegrations = (store: Store<ModuleStore>) => {
    store.subscribe(mutation => {
        switch(mutation.type) {
            // On session dump
            case "ActivitySetsStore/dumpSession":
            // On timeline breakout feature change
            case "AppSettingsStore/setTimelineBreakout":
            // On timeline stack CAR types change
            case "AppSettingsStore/setTimelineStackCarTypes":
            // On data loaded
            case "ActivitySetsStore/incrementDataLoadedCounter":
                store.dispatch(
                    "ActivitySetTimelineStore/_updateTimelineBreakout", 
                    null, { root: true }
                );
                break;
            // On timeline sort feature change
            case "AppSettingsStore/setTimelineSort":
                store.dispatch(
                    "ActivitySetTimelineStore/_updateTimelineSort", 
                    mutation.payload.value, { root: true }
                );
                break;
        }
    })
}
