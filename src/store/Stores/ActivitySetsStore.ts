import Features from "@/assets/rey.features";
import { clamp } from "@/assets/scripts/Math";
import { markRaw } from "vue";
import { ActivitySetInfo } from "@/assets/scripts/ViewData/ActivitySetInfo";
import { GenericViewItem } from "@/assets/scripts/Visualizations/ViewBaseTypes/GenericViewItem"
import { ChronologicalIndex } from "@/assets/scripts/Collections/ChronologicalIndex"
import { type ITimeframe, Timeframe } from "@/assets/scripts/Collections/Timeframe"
import { MalformedActivitySetError } from "../Exceptions/MalformedActivitySetError";
import { MalformedLateralMovementError } from "../Exceptions/MalformedLateralMovementError";
import { 
    Focus, 
    Select,  
    Visibility,
    IsCollapsed
} from "@/assets/scripts/Visualizations/ViewBaseTypes/GeneralAttributes"
import { 
    EdgeType, 
    EdgeTypeMask, 
    HasAnalyticsHidden
} from "@/assets/scripts/ViewData/ExtendedAttributes"
import {
    ActivitySetPlainEdge,
    type ActivitySetCommonEdge,
    ActivitySetAnalyticEdge
} from "@/assets/scripts/ViewData/ViewEdge"
import { 
    ActivitySetEventNode,
    type ActivitySetCommonNode,
    ActivitySetAnalyticNode, 
} from "@/assets/scripts/ViewData/ViewNode";
import type { Module, Store } from "vuex";
import type { ModuleStore, ActivitySetsStore } from "@/store/StoreTypes"
import type { 
    ActivitySetFile, 
    ActivitySetEdge, 
    ActivitySetEvent,
    ActivitySetApiData, 
    LateralMovementFile,
} from "@/assets/scripts/ViewData/ActivitySetFileTypes";

const { activity_set_graph: GraphFeatures } = Features;

export default {
    namespaced: true,
    state: {
        sets: new Map(),
        nodes: markRaw(new Map()),
        edges: markRaw(new Map()),
        focus: Timeframe.TODAY.copy(),
        selected: new Map(),
        collapsed: new Map(),
        timeframe: markRaw(Timeframe.TODAY.copy()),
        timeIndex: markRaw(new ChronologicalIndex<ActivitySetCommonNode>()),
        triggerDataLoaded: 0,
        triggerDataFocused: 0,
        triggerDataDisplay: 0,
        triggerDataSelected: 0,
        triggerNetworkLayout: 0,
        triggerCameraFocus: 0
    },

    getters: {

        /**
         * [INTERNAL USE ONLY]
         * Returns the day / night mode's focus snap parameters.
         * @param state
         *  The Vuex state.
         * @param _g,
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The day / night mode's focus snap parameters
         */
        _getDayNightModeSnapParams(state, _g, rootState): { duration: number, offset: number } {
            // NOTE:
            // Using the timeframe's beg date to offset the day / night mode's
            // timeframe into the correct timezone. (Only until the timezone
            // can be set explicitly. Snap features should account for DST.)
            // This is a temporary solution.
            let tf = rootState.AppSettingsStore.active_day_night_mode.timeframe;
            let beg = new Date(state.timeframe.beg);
            beg.setHours(tf.end.getHours());
            beg.setMinutes(tf.end.getMinutes());
            beg.setSeconds(tf.end.getSeconds());
            beg.setMilliseconds(0);
            let end = new Date(state.timeframe.beg);
            end.setHours(tf.beg.getHours());
            end.setMinutes(tf.beg.getMinutes());
            end.setSeconds(tf.beg.getSeconds());
            end.setMilliseconds(0);
            // Calculate snap parameters
            let day = 8.64e+7;
            let duration = Math.abs(beg.getTime() - end.getTime());
            if(end < beg) {
                duration = day - Math.min(duration, day);
            } else {
                duration = Math.min(duration, day);
            }
            let offset = beg.getTime() % day;
            // Return snap parameters
            return { duration, offset };
        }

    },

    actions: {


        ///////////////////////////////////////////////////////////////////////
        //  1. Importing Activity Set Data  ///////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Imports Activity Sets into the store.
         * @param ctx
         *  The Vuex context.
         * @param importParams
         *  [files]
         *   An Activity Set Import or an array of Activity Set Imports.
         *  [refs]
         *   A node id, or an array of node ids, to focus on.
         *   `undefined` if none.
         * @throws { MalformedActivitySetError }
         *  If `files` contains an improperly formatted Activity Set file.
         */
        async importActivitySetFiles(ctx, { files, refs }: ActivitySetImportParams) {
            let { commit, dispatch, state } = ctx;
            
            // Convert files and refs to arrays if necessary
            refs = refs ?? [];
            if(!Array.isArray(files)) files = [files];
            if(!Array.isArray(refs)) refs = [refs];
            
            // Load activity sets
            for(let file of files) {
                await dispatch("_loadActivitySetData", file);
            }
            
            // Focus on node references
            await dispatch("unselectAll");
            await dispatch("selectItems", refs);
            
            // Increment data loaded trigger
            commit("incrementDataLoadedCounter");
            
            // Reset time focus
            await dispatch("_resetTimeFocus", {
                beg: state.timeframe.beg,
                end: state.timeframe.end
            });

        },

        /**
         * Imports a Lateral Movement file into the store.
         * @param ctx
         *  The Vuex context.
         * @param file
         *  The Lateral Movement file.
         * @throws { MalformedLateralMovementError }
         *  If `file` is an improperly formatted Lateral Movement file.
         */
        async importLateralMovementFile(ctx, file: LateralMovementFile | string) {
            let { commit, dispatch, state } = ctx;
            
            // Parse string to JSON if necessary
            if (file.constructor.name === String.name) {
                file = JSON.parse(file as string) as LateralMovementFile;
            }
            
            // Load lateral movements
            await dispatch("_loadLateralMovementsData", file);
            
            // Increment data loaded trigger
            commit("incrementDataLoadedCounter");
            
            // Reset time focus
            await dispatch("_resetTimeFocus", {
                beg: state.timeframe.beg,
                end: state.timeframe.end
            });

        },

        /**
         * Empties all Activity Set stores of all Activity Set data.
         * @param ctx
         *  The Vuex context.
         */
        dumpSession({ commit }) {
            commit("dumpSession");
        },


        ///////////////////////////////////////////////////////////////////////
        //  2. Loading Activity Set Data  /////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * [INTERNAL USE ONLY]
         * Loads an Activity Set into the store.
         * @param ctx
         *  The Vuex Context.
         * @param fileImport
         *  The Activity Set import.
         *  [file]
         *   The Activity Set file.
         *  [data]
         *   The Activity Set API data.
         * @throws { MalformedActivitySetError }
         *  If `file` is an improperly formatted Activity Set file.
         */
        async _loadActivitySetData(ctx, { file, data }: ActivitySetImport) {
            let { commit, dispatch, state, rootState } = ctx;
            try {

                // Configure first-time duration
                if (state.nodes.size === 0) {
                    let TIME_MAX = new Date(8640000000000000);
                    let TIME_MIN = new Date(-8640000000000000);
                    state.timeframe = new Timeframe(TIME_MAX, TIME_MIN)
                }

                // Get timeframe time
                let durationBeg = state.timeframe.beg.getTime();
                let durationEnd = state.timeframe.end.getTime();

                // Events
                let features = GraphFeatures.clustering_features as Array<keyof ActivitySetEvent>;
                for (let event of file.events) {
                    if (state.nodes.has(event.event_id)) continue;
                    // Parse dates
                    event.time = new Date(
                        (event.time as any).toLocaleUpperCase()
                    );
                    // Create event node
                    let node = markRaw(new ActivitySetEventNode(file.activity_set_id, event, features));
                    // Set CAR attributes on event 
                    let object = node.getObjectTypeString();
                    let action = node.getActionTypeString();
                    event.car_attributes = `${object} ${action}`;
                    // Add event node
                    commit("addNode", node);
                    // Update duration timeframe
                    durationBeg = Math.min(durationBeg, event.time.getTime())
                    durationEnd = Math.max(durationEnd, event.time.getTime())
                }

                // Set duration timeframe
                commit("setTimeframe", {
                    beg: new Date(durationBeg),
                    end: new Date(durationEnd)
                })

                // Analytics
                for (let analytic of (file.analytic_results ?? file.alerts)!) {
                    if (state.nodes.has(analytic.analytic_result_id)) continue;
                    // Get source
                    let src = state.nodes.get(analytic.key_event) as ActivitySetEventNode;
                    if (src === undefined) {
                        throw new MalformedActivitySetError(
                            "Import Failed: Malformed Activity Set File",
                            `Analytic node '${ 
                                analytic.analytic_result_id 
                            }' missing source node '${ 
                                analytic.key_event 
                            }'.`,
                            {
                                event_id: analytic.key_event,
                                analytic_id: analytic.analytic_result_id,
                            }
                        );
                    }
                    // Parse time
                    let time = new Date(src.time);
                    // Create and add analytic node
                    let node = markRaw(new ActivitySetAnalyticNode(file.activity_set_id, src, time, analytic));
                    commit("addNode", node);
                    // Create and add analytic edge
                    let id = `${analytic.key_event}->${node.id}`;
                    let len = GraphFeatures.analytic_edge_length;
                    let edge = markRaw(new ActivitySetAnalyticEdge(id, src, node, len, time));
                    commit("addEdge", edge);
                }

                // Edges
                for (let edge of file.edges)
                    await dispatch("_addActivitySetEdge", edge);

                // Collapse analytic nodes, if required
                let { display_analytic_nodes } = rootState
                    .AppSettingsStore.settings.view.graph;
                if(!display_analytic_nodes) 
                    commit("setAnalyticVisibility", display_analytic_nodes);

                // Create activity set info
                let activitySetInfo = markRaw(new ActivitySetInfo(file, data.score));

                // Add activity set info
                commit("addActivitySet", activitySetInfo);

            } catch(ex: any) {
                if(ex instanceof MalformedActivitySetError) {
                    throw ex;
                } else {
                    throw new MalformedActivitySetError(
                        "Import Failed: Malformed Activity Set File",
                        `Cannot load activity set file: ${ ex?.message ?? ex }`
                    );
                }
            }
        },

        /**
         * [INTERNAL USE ONLY]
         * Loads lateral movements into the store.
         * @param ctx
         *  The Vuex context.
         * @param file
         *  The lateral movement data.
         * @throws { MalformedLateralMovementError }
         *  If `file` is an improperly formatted Lateral Movement file.
         */
        async _loadLateralMovementsData(ctx, file: LateralMovementFile) {
            let { dispatch } = ctx;
            try {
                // Edges
                for (let edge of file.moves)
                    await dispatch("_addActivitySetEdge", edge);
            } catch(ex: any) {
                throw new MalformedLateralMovementError(
                    "Import Failed: Malformed Lateral Movement File",
                    `Cannot load lateral movement file: ${ ex?.message ?? ex }`
                );
            }
        },

        /**
         * [INTERNAL USE ONLY]
         * Adds an activity set edge to the store.
         * @param ctx
         *  The Vuex context.
         * @param edge
         *  The edge's activity set data.
         */
        _addActivitySetEdge(ctx, edge: ActivitySetEdge) {
            let { commit, state, rootState } = ctx;
            let {
                display_lateral_movements,
                active_clustering_features
            } = rootState.AppSettingsStore.settings.view.graph
            // Create edge
            let id = `${edge.src_event}->${edge.dest_event}`;
            if (state.edges.has(id))
                return;
            let source = state.nodes.get(edge.src_event);
            let target = state.nodes.get(edge.dest_event);
            let length = GraphFeatures.event_edge_length;
            if (source !== undefined && target !== undefined) {
                let e = markRaw(new ActivitySetPlainEdge(id, source, target, length, target.time, edge));
                // Set weak edge visibility
                if(!display_lateral_movements && !e.isStrongEdge(active_clustering_features))
                    e.setVisibility(Visibility.Hidden);
                // Add edge to store
                commit("addEdge", e);
            } else {
                // TODO: Notify via notification system
                console.log(`Warning: Broken link ${edge.src_event} -> ${edge.dest_event}`);
            }
        },


        ///////////////////////////////////////////////////////////////////////
        //  3. Altering Focus  ////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Sets the focus start time.
         * @param ctx
         *  The Vuex Context.
         * @param newBeg
         *  The new focus start time.
         */
        setFocusBeg({ dispatch, state }, newBeg: Date) {
            let MINIMUM_FOCUS = Features.time.minimum_focus_width;
            // Clamp new focus
            newBeg.setTime(clamp(
                newBeg.getTime(),
                state.timeframe.beg.getTime(),
                state.focus.end.getTime() - MINIMUM_FOCUS
            ));
            // Set new focus
            dispatch("_setTimeFocus", {
                beg: newBeg,
                end: state.focus.end
            });
        },

        /**
         * Sets the focus end time.
         * @param context
         *  The Vuex context.
         * @param newEnd
         *  The new focus end time.
         */
        setFocusEnd({ dispatch, state }, newEnd: Date) {
            let MINIMUM_FOCUS = Features.time.minimum_focus_width;
            // Clamp new focus
            newEnd.setTime(clamp(
                newEnd.getTime(),
                state.focus.beg.getTime() + MINIMUM_FOCUS,
                state.timeframe.end.getTime()
            ));
            // Set new focus
            dispatch("_setTimeFocus", {
                beg: state.focus.beg,
                end: newEnd
            });
        },

        /**
         * Slides the focus timeframe forward or backward.
         * @param ctx
         *  The Vuex context.
         * @param delta
         *  The amount of time (in milliseconds) to slide the timeframe by.
         */
        slideFocus({ dispatch, state }, delta: number) {
            let timeframe = state.timeframe;
            let focus = state.focus;
            if (delta < 0) {
                delta = Math.max(timeframe.beg.getTime() - focus.beg.getTime(), delta);
            } else if (0 < delta) {
                delta = Math.min(timeframe.end.getTime() - focus.end.getTime(), delta);
            } else return;
            dispatch("_setTimeFocus", {
                beg: new Date(focus.beg.getTime() + delta),
                end: new Date(focus.end.getTime() + delta)
            });
        },

        /**
         * Zooms the focus timeframe in or out.
         * @param ctx 
         *  The Vuex context.
         * @param zoomParams
         * [focalTime] 
         *  The focal time that serves as the zoom's origin. (This time should
         *  lie within the current focus timeframe.)
         * [delta]
         *  The amount of time (in milliseconds) to grow (or shrink) the focus
         *  timeframe by.
         */
        zoomFocus({ dispatch, state }, { focalTime, delta }: ZoomParams) {
            let MINIMUM_FOCUS = Features.time.minimum_focus_width;
            // Compute zoom
            let oldFocusDur = state.focus.getDuration();
            let maxFocusDur = state.timeframe.getDuration();
            let newFocusDur = clamp(oldFocusDur - delta, MINIMUM_FOCUS, maxFocusDur);
            let percentOffsetInFocus = state.focus.getPercentIn(focalTime);
            let beg = focalTime.getTime() - (percentOffsetInFocus * newFocusDur);
            // Bound zoom
            let { beg: tfBeg, end: tfEnd } = state.timeframe;
            let newBeg = clamp(beg, tfBeg.getTime(), tfEnd.getTime() - newFocusDur);
            let newEnd = newBeg + newFocusDur;
            // Set new focus
            dispatch("_setTimeFocus", {
                beg: new Date(newBeg),
                end: new Date(newEnd)
            });
        },

        /**
         * Snaps the focus timeframe to a time period.
         * @param ctx
         *  The Vuex context.
         * @param snapParams
         *  [time]
         *   The time period.
         *   [day]      Snap to the nearest day.
         *   [night]    Snap to the nearest night.
         *  [direction]
         *   The direction of the snap.
         *   [none]     Snap to the nearest time period.
         *   [forward]  Snap forward to the nearest time period.
         *   [backward] Snap backward to the nearest time period.
         */
        snapFocus({ dispatch, state, getters }, { time, direction }: SnapFocusParams) {
            let MINIMUM_FOCUS = Features.time.minimum_focus_width;

            let day = 8.64e+7;
            let { offset, duration } = getters._getDayNightModeSnapParams;
            let beg = state.focus.beg.getTime();
            let end = state.focus.end.getTime();
            let dayDur = day - duration;
            let nigDur = duration; 

            // Determine snap time
            let snapTime;
            switch(direction) {
                case "none":
                case "forward":
                    snapTime = beg;
                    break;
                case "backward":
                    snapTime = end;
                    break;
            }

            // Snap time
            let newTime, isDay;
            let snapBeg = snapTime - ((snapTime - offset) % day);
            let snapMid = snapBeg + duration;
            let snapEnd = snapBeg + day;
            let isEndAligned = direction === "backward"; 
            if(snapBeg <= beg && end <= snapMid) {
                isDay = false;
                newTime = isEndAligned ? snapMid : snapBeg;
            } else if(snapMid <= beg && end <= snapEnd) {
                isDay = true;
                newTime = isEndAligned ? snapEnd : snapMid;
            } else {
                let min = Infinity, snap;
                snap = Math.abs(snapBeg - snapTime);
                if(snap < min) {
                    min = snap;
                    isDay = isEndAligned;
                    newTime = snapBeg;
                }
                snap = Math.abs(snapMid - snapTime);
                if(snap < min) {
                    min = snap;
                    isDay = !isEndAligned;
                    newTime = snapMid;
                }
                snap = Math.abs(snapEnd - snapTime);
                if(snap < min) {
                    min = snap;
                    isDay = isEndAligned;
                    newTime = snapEnd;
                }
            }
            
            // Snap in direction
            let newBeg, newEnd;
            let dur = isDay ? dayDur : nigDur;
            switch(direction) {
                case "none":
                case "forward":
                    newBeg = newTime;
                    newEnd = newBeg + dur;
                    if(isDay && time === "night") {
                        newBeg += dayDur;
                        newEnd = newBeg + nigDur;
                        break;
                    }
                    if(!isDay && time === "day") {
                        newBeg += nigDur;
                        newEnd = newBeg + dayDur;
                        break;
                    }
                    if(direction === "forward") {
                        newBeg += day;
                        newEnd += day;
                    }
                    break;
                case "backward":
                    newEnd = newTime;
                    newBeg = newEnd - dur;
                    if(isDay && time === "night") {
                        newBeg -= nigDur;
                        newEnd = newBeg + nigDur;
                        break;
                    }
                    if(!isDay && time === "day") {
                        newBeg -= dayDur;
                        newEnd = newBeg + dayDur;
                        break;
                    }
                    newBeg -= day;
                    newEnd -= day;
                    break;

            }

            // Update time
            let tfBeg = state.timeframe.beg.getTime();
            let tfEnd = state.timeframe.end.getTime();
            if((tfBeg + MINIMUM_FOCUS) <= newEnd && newBeg <= (tfEnd - MINIMUM_FOCUS)) {
                dispatch("_setTimeFocus", {
                    beg: new Date(clamp(newBeg, tfBeg, tfEnd)),
                    end: new Date(clamp(newEnd, tfBeg, tfEnd))
                })
            } else {
                // If snap exists outside of timeframe, don't snap
                // TODO: Notify that there are no other days / nights.
            }

        },

        /**
         * Nudges the focus timeframe (1 interval unit) in the given direction.
         * @param ctx
         *  The Vuex context. 
         * @param direction
         *  The direction to nudge.
         */
        nudgeFocus({ dispatch, state, rootState }, direction: "forward" | "backward") {
            let interval = rootState.AppSettingsStore.active_nudge_interval.time;
            // Calculate delta
            let delta;
            if (interval === 0) {
                let newBeg = state.focus.beg;
                if (direction === "forward") {
                    newBeg = state.timeIndex.getNextTimeStep(newBeg) ?? newBeg;
                } else {
                    newBeg = state.timeIndex.getPrevTimeStep(newBeg) ?? newBeg;
                }
                delta = newBeg.getTime() - state.focus.beg.getTime()
            } else {
                delta = (direction === "forward" ? 1 : -1) * interval;
            }
            // Slide focus
            dispatch("slideFocus", delta)
        },

        /**
         * Nudges the focus start time (1 interval unit) in the given
         * direction.
         * @param ctx
         *  The Vuex context.
         * @param direction
         *  The direction to nudge.
         */
        nudgeFocusBeg({ dispatch, state, rootState }, direction: "forward" | "backward") {
            let interval = rootState.AppSettingsStore.active_nudge_interval.time;
            // Calculate new start
            let newBeg = state.focus.beg;
            if (interval === 0) {
                if (direction === "forward") {
                    newBeg = state.timeIndex.getNextTimeStep(newBeg) ?? newBeg;
                } else {
                    newBeg = state.timeIndex.getPrevTimeStep(newBeg) ?? newBeg;
                }
            } else {
                let sign = direction === "forward" ? 1 : -1;
                newBeg = new Date(newBeg.getTime() + (sign * interval));
            }
            // Set new focus
            dispatch("setFocusBeg", newBeg)
        },

        /**
         * Nudges the focus end time (1 interval unit) in the given direction.
         * @param ctx
         *  The Vuex context.
         * @param direction
         *  The direction to nudge.
         */
        nudgeFocusEnd({ dispatch, state, rootState }, direction: "forward" | "backward") {
            let interval = rootState.AppSettingsStore.active_nudge_interval.time;
            // Calculate new end
            let newEnd = state.focus.end;
            if (interval === 0) {
                if (direction === "forward") {
                    newEnd = state.timeIndex.getNextTimeStep(newEnd) ?? newEnd;
                } else {
                    newEnd = state.timeIndex.getPrevTimeStep(newEnd) ?? newEnd;
                }
            } else {
                let sign = direction === "forward" ? 1 : -1;
                newEnd = new Date(newEnd.getTime() + (sign * interval));
            }
            // Set new focus
            dispatch("setFocusEnd", newEnd)
        },

        /**
         * [INTERNAL USE ONLY]
         * Sets the focus start and end to the given times.
         * @param ctx
         *  The Vuex context.
         * @param timeframe
         *  The new focus start and end time.
         */
        _setTimeFocus({ commit, state }, { beg: nBeg, end: nEnd }: ITimeframe) {
            let oBeg = state.focus.beg, oEnd = state.focus.end;
            let oBegT = oBeg.getTime();
            let oEndT = oEnd.getTime();
            let nBegT = nBeg.getTime();
            let nEndT = nEnd.getTime();
            // If new focus overlaps old focus:
            if (state.focus.isTimeRangeOverlapping(nBeg, nEnd)) {
                // Save time by only updating items outside of the overlap
                let dS = oBegT - nBegT, dE = nEndT - oEndT;
                if (dS < 0) {
                    let t_nBeg = new Date(nBeg.getTime() - 1)
                    commit("setItemFocusState", {
                        beg: oBeg, end: t_nBeg, focus: false
                    });
                } else if (0 < dS) {
                    commit("setItemFocusState", {
                        beg: nBeg, end: oBeg, focus: true
                    });
                }
                if (dE < 0) {
                    let t_nEnd = new Date(nEnd.getTime() + 1)
                    commit("setItemFocusState", {
                        beg: t_nEnd, end: oEnd, focus: false
                    });
                } else if (0 < dE) {
                    commit("setItemFocusState", {
                        beg: oEnd, end: nEnd, focus: true
                    });
                }
            }
            // If new focus doesn't overlap old focus:
            else {
                // Update each set of items independently
                commit("setItemFocusState", {
                    beg: oBeg, end: oEnd, focus: false
                });
                commit("setItemFocusState", {
                    beg: nBeg, end: nEnd, focus: true
                });
            }
            // Update focus timeframe
            commit("setFocusTimeframe", { beg: nBeg, end: nEnd });
            // Increment data focused trigger
            commit("incrementDataFocusedCounter");
        },

        /**
         * [INTERNAL USE ONLY]
         * Sets the focus start and end to the given times.
         * 
         * NOTE:
         * Use after adding new nodes or edges to the store. Under those 
         * circumstances, *every* item has to have its focus state updated. In
         * any other case, use the more efficient `_setTimeFocus` which only
         * updates the items that have exited and entered focus.
         * 
         * @param ctx
         *  The Vuex context.
         * @param timeframe
         *  The new focus start and end time.
         */
        _resetTimeFocus({ commit, state }, { beg, end }: ITimeframe) {
            let tfBeg = state.timeframe.beg;
            let tfEnd = state.timeframe.end;
            let t_beg = new Date(beg.getTime() - 1);
            let t_end = new Date(end.getTime() + 1);
            // Update all items
            commit("setItemFocusState", { beg: tfBeg, end: t_beg, focus: false });
            commit("setItemFocusState", { beg, end, focus: true });
            commit("setItemFocusState", { beg: t_end, end: tfEnd, focus: false });
            // Update focus timeframe
            commit("setFocusTimeframe", { beg, end });
            // Increment data focused trigger
            commit("incrementDataFocusedCounter");
        },


        ///////////////////////////////////////////////////////////////////////
        //  4. Altering Selection  ////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Adds an item to the current selection.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the item to select.
         */
        selectItem({ commit, state }, id: string) {
            let item = /->/.test(id) ? state.edges.get(id) : state.nodes.get(id);
            if (item) {
                commit("addItemToSelection", item);
            }
            commit("incrementDataSelectedCounter");
        },

        /**
         * Adds a set of items to the current selection.
         * @param ctx
         *  The Vuex context.
         * @param ids
         *  The ids of the items to select.
         */
        selectItems({ commit, state }, ids: string[]) {
            let item;
            for(let id of ids) {
                item = /->/.test(id) ? state.edges.get(id) : state.nodes.get(id);
                if (item) {
                    commit("addItemToSelection", item);
                }
            }
            commit("incrementDataSelectedCounter");
        },

        /**
         * Adds all nodes in the store to the current selection.
         * @param ctx
         *  The Vuex context.
         */
        selectAllNodes({ state, commit }) {
            for(let item of state.nodes.values()) {
                commit("addItemToSelection", item);
            }
            commit("incrementDataSelectedCounter");
        },

        /**
         * Adds all items between an item and its root to the current
         * selection.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the item to traceback.
         */
        selectTraceback({ commit, state }, id: string) {
            // Resolve starting node
            let node: ActivitySetCommonNode | undefined;
            if (/->/.test(id)) {
                let edge = state.edges.get(id);
                if (edge) {
                    commit("addItemToSelection", edge);
                    node = edge.source;
                }
            } else {
                node = state.nodes.get(id);
            }
            // If found, traceback node
            if (node) {
                let stack = [node];
                let visited = new Set();
                while (0 < stack.length) {
                    // Get node
                    let item = stack.pop()!;
                    if (visited.has(item.id))
                        continue;
                    // Select node
                    commit("addItemToSelection", item);
                    // Traverse downward
                    visited.add(item.id);
                    for (let edge of item.prev) {
                        if ((edge.attrs & EdgeTypeMask) === EdgeType.NonCausal)
                            continue;
                        // Select edge
                        commit("addItemToSelection", edge);
                        stack.push(edge.source);
                    }
                }
            }
            commit("incrementDataSelectedCounter");
        },

        /**
         * Shifts selection to the current selection's children.
         * @param ctx
         *  The Vuex context.
         */
        shiftSelectionToChildren({ dispatch, commit, state }) {
            // Clear current selection
            let current = [...state.selected.keys()];
            if(current.length === 0)
                return;
            dispatch("unselectAll");
            // Select all node children
            for (let id of current) {
                let node = state.nodes.get(id);
                if (!node) continue;
                for (let edge of node.next) {
                    commit("addItemToSelection", edge.target);
                }
            }
            commit("incrementDataSelectedCounter");
        },

        /**
         * Shifts selection to the current selection's parents.
         * @param ctx
         *  The Vuex context.
         */
        shiftSelectionToParents({ dispatch, commit, state }) {
            // Clear current selection
            let current = [...state.selected.keys()];
            if(current.length === 0)
                return;
            dispatch("unselectAll");
            // Select all node parents
            for (let id of current) {
                let node = state.nodes.get(id);
                if (!node) continue;
                for (let edge of node.prev) {
                    commit("addItemToSelection", edge.source);
                }
            }
            commit("incrementDataSelectedCounter");
        },

        /**
         * Removes an item from the current selection.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the item to unselect.
         */
        unselectItem({ commit, state }, id: string) {
            let item = /->/.test(id) ? state.edges.get(id) : state.nodes.get(id);
            if (item) {
                commit("remItemFromSelection", item);
            }
            commit("incrementDataSelectedCounter");
        },

        /**
         * Removes all items from the current selection.
         * @param ctx
         *  The Vuex context.
         */
        unselectAll({ commit }) {
            commit("remAllItemsFromSelection");
            commit("incrementDataSelectedCounter");
        },


        ///////////////////////////////////////////////////////////////////////
        //  5. Altering Collapse  /////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Sets a node's collapsed state.
         * @param ctx
         *  The Vuex context.
         * @param collapseParams
         *  [id]
         *   The id of the node to collapse / expand.
         *  [value]
         *   The collapsed state. (true = collapsed, false = expanded)
         */
        setNodeCollapse({ commit, state }, { id, value }: { id: string, value: boolean }) {
            if (state.nodes.has(id)) {
                // Expand node
                let node = state.nodes.get(id);
                commit("setNodeCollapseState", { node, value });
                // Increment network layout trigger
                commit("incrementNetworkLayoutCounter");
            }
        },


        ///////////////////////////////////////////////////////////////////////
        //  6. Altering Visibility  ///////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * [INTERNAL USE ONLY]
         * Updates weak edge visibility based on the current cluster and
         * lateral movement visibility settings.
         * @param ctx
         *  The Vuex context.
         */
        _updateWeakEdgeVisibility({ commit, rootState }) {
            // Resolve current state
            let { 
                display_lateral_movements,
                active_clustering_features
            } = rootState.AppSettingsStore.settings.view.graph;
            // Apply current state
            commit("setWeakEdgeVisibility", {
                features: active_clustering_features,
                visible: display_lateral_movements
            });
            // Increment data display trigger
            commit("incrementDataDisplayCounter");
        },
        
        /**
         * [INTERNAL USE ONLY]
         * Updates analytic node visibility based on the current analytic
         * node visibility setting.
         * @param ctx
         *  The Vuex context.
         */
        _updateAnalyticVisibility({ commit, rootState }) {
            // Resolve current state
            let { display_analytic_nodes } = rootState
                .AppSettingsStore.settings.view.graph;
            // Apply current state
            commit("setAnalyticVisibility", display_analytic_nodes);
            commit("incrementNetworkLayoutCounter");
        },


        ///////////////////////////////////////////////////////////////////////
        //  7. Camera Actions  ////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Triggers the camera's focus action.
         * @param ctx
         *  The Vuex Context.
         */
        triggerCameraFocus({ commit, state }) {
            if(state.selected.size === 0)
                return;
            commit("incrementCameraFocusCounter");
        }

    },

    mutations: {

        /**
         * Adds an ActivitySetInfo to the store.
         * @param state
         *  The Vuex state.
         * @param id
         *  The activity set to add.
         */
        addActivitySet(state, info: ActivitySetInfo) {
            state.sets.set(info.id, info);
        },

        /**
         * Adds an ActivitySetCommonNode to the store.
         * @param state
         *  The Vuex state.
         * @param node
         *  The node to add.
         */
        addNode(state, node: ActivitySetCommonNode) {
            state.nodes.set(node.id, node);
            state.timeIndex.add(node);
        },

        /**
         * Adds a ActivitySetCommonEdge to the store.
         * @param state
         *  The Vuex state.
         * @param edge
         *  The edge to add.
         */
        addEdge(state, edge: ActivitySetCommonEdge) {
            state.edges.set(edge.id, edge);
            edge.source.next.push(edge);
            edge.target.prev.push(edge);
        },

        /**
         * Sets the total timeframe encompassed by the store. 
         * @param state
         *  The Vuex state.
         * @param time 
         *  The timeframe's start and end time.
         */
        setTimeframe(state, time: ITimeframe) {
            state.timeframe.beg = time.beg;
            state.timeframe.end = time.end;
        },

        /**
         * Sets the focus timeframe.
         * @param state
         *  The Vuex state.
         * @param time
         *  The focus timeframe's start and end time.
         */
        setFocusTimeframe(state, time: ITimeframe) {
            state.focus.beg = time.beg;
            state.focus.end = time.end;
        },

        /**
         * Sets the focus state for all items within the specified timeframe.
         * @param state
         *  The Vuex state.
         * @param focusParams
         *  [beg]
         *   The start of the timeframe.
         *  [end]
         *   The end of the timeframe.
         *  [focus] 
         *   The focus state. (true = focused, false = not focused)
         */
        setItemFocusState(state, { beg, end, focus }: ItemFocusStateParams) {
            let nodes = state.timeIndex.search(beg, end);
            for (let node of nodes as ActivitySetCommonNode[]) {
                let flag = focus ? Focus.Focus : Focus.NoFocus1;
                node.setFocus(Focus.NoFocus1, flag);
                for(let edge of node.prev) {
                    edge.setFocus(Focus.NoFocus1, flag);
                }
            }
        },

        /**
         * Adds an item to the current selection.
         * @param state
         *  The Vuex state.
         * @param item
         *  The item.
         */
        addItemToSelection(state, item: GenericViewItem) {
            let s = state.selected;
            if (s.has(item.id))
                return;
            // Set selection bit
            if (s.size === 0) {
                item.setSelection(Select.Single);
            } else if (s.size === 1) {
                let sing = s.values().next().value;
                sing.setSelection(Select.Multi);
                item.setSelection(Select.Multi);
            } else {
                item.setSelection(Select.Multi);
            }
            // Add item to selection
            s.set(item.id, item);
        },

        /**
         * Removes an item from the current selection.
         * @param state
         *  The Vuex state.
         * @param item
         *  The item.
         */
        remItemFromSelection(state, item: GenericViewItem) {
            let s = state.selected;
            if (!s.has(item.id))
                return;
            // Clear selection bit
            item.setSelection(Select.Unselected);
            // Remove item if it exists
            s.delete(item.id);
            // Set remaining node to single selection (if applicable)
            if (s.size === 1) {
                let sing = s.values().next().value;
                sing.setSelection(Select.Single);
            }
        },

        /**
         * Removes all items from the current selection.
         * @param state
         *  The Vuex state.
         */
        remAllItemsFromSelection(state) {
            let s = state.selected;
            for (let [id, item] of state.selected) {
                item.setSelection(Select.Unselected);
                s.delete(id);
            }
        },

        /**
         * Sets a node's collapsed state.
         * @param state
         *  The Vuex state.
         * @param collapseParams
         *  [node]
         *   The node to collapse / expand.
         *  [value]
         *   The collapsed state. (true = collapsed, false = expanded)
         */
        setNodeCollapseState(state, { node, value }: CollapseParams) {
            if(value) {
                state.collapsed.set(node.id, node);
                node.setCollapsed(IsCollapsed.True);
            } else {
                state.collapsed.delete(node.id);
                node.setCollapsed(IsCollapsed.False);
            }
        },

        /**
         * Sets weak edge visibility.
         * @param state
         *  The Vuex state.
         * @param displayParams
         * [features]
         *  The set of critical features used to derive strong and weak edges.
         * [visible]
         *  The visibility state. (true = visible, false = hidden)
         */
        setWeakEdgeVisibility(state, { features, visible }: DisplayWeakEdgesParams) {
            let flag = visible ? Visibility.Visible : Visibility.Hidden;
            for(let edge of state.edges.values()) {
                if(edge.isStrongEdge(features)) {
                    edge.setVisibility(Visibility.Visible);
                } else {
                    edge.setVisibility(flag);
                }
            }
        },

        /**
         * Sets analytic node visibility.
         * @param state
         *  The Vuex state.
         * @param visible
         *  [true]
         *   All analytic nodes will be made visible.
         *  [false]
         *   All analytic nodes will be hidden.
         */
        setAnalyticVisibility(state, visible: boolean) {
            let flag1 = visible ? IsCollapsed.False : IsCollapsed.True;
            let flag2 = visible ? HasAnalyticsHidden.False : HasAnalyticsHidden.True;
            let edge, src;
            for(let node of state.nodes.values()) {
                if(!node.isAnalytic()) continue;
                edge = node.prev[0]!, src = edge.source;
                edge.setCollapsed(flag1);
                src.setHasAnalyticsHidden(flag2);
            }
        },

        /**
         * Increments the data loaded trigger.
         * @param state
         *  The Vuex state.
         */
        incrementDataLoadedCounter(state) {
            state.triggerDataLoaded++;
        },

        /**
         * Increments the data focused trigger.
         * @param state
         *  The Vuex state.
         */
        incrementDataFocusedCounter(state) {
            state.triggerDataFocused++;
        },

        /**
         * Increments the data display trigger.
         * @param state
         *  The Vuex state.
         */
        incrementDataDisplayCounter(state) {
            state.triggerDataDisplay++;
        },

        /**
         * Increments the data selected trigger.
         * @param state
         *  The Vuex state.
         */
        incrementDataSelectedCounter(state) {
            state.triggerDataSelected++;
        },

        /**
         * Increments the network layout trigger.
         * @param state
         *  The Vuex state.
         */
        incrementNetworkLayoutCounter(state) {
            state.triggerNetworkLayout++;
        },

        /**
         * Increments the camera focus trigger.
         * @param state
         *  The Vuex state.
         */
        incrementCameraFocusCounter(state) {
            state.triggerCameraFocus++;
        },

        /**
         * Completely empties the store of all Activity Set data.
         * @param state
         *  The Vuex state.
         */
        dumpSession(state) {
            state.sets = new Map();
            state.nodes = markRaw(new Map());
            state.edges = markRaw(new Map());
            state.focus = Timeframe.TODAY.copy();
            state.selected = new Map();
            state.collapsed = new Map();
            state.timeframe = markRaw(Timeframe.TODAY.copy());
            state.timeIndex = markRaw(new ChronologicalIndex<ActivitySetCommonNode>());
            state.triggerDataLoaded = 0;
            state.triggerDataFocused = 0;
            state.triggerDataDisplay = 0;
            state.triggerDataSelected = 0;
            state.triggerNetworkLayout = 0;
            state.triggerCameraFocus = 0;
        }

    }
} as Module<ActivitySetsStore, ModuleStore>


///////////////////////////////////////////////////////////////////////////////
//  Store Integrations  ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export const SetsStoreIntegrations = (store: Store<ModuleStore>) => {
    store.subscribe(mutation => {
        switch(mutation.type) {
            case "AppSettingsStore/enableClusterFeature":
                // On cluster features change
                store.dispatch(
                    "ActivitySetsStore/_updateWeakEdgeVisibility", 
                    null, { root: true }
                );
                break;
            case "AppSettingsStore/setGraphViewDisplaySetting":
                switch(mutation.payload.id) {
                    // On display_analytic_nodes change
                    case "display_analytic_nodes":
                        store.dispatch(
                            "ActivitySetsStore/_updateAnalyticVisibility", 
                            null, { root: true }
                        );
                        break;
                    // On display_lateral_movements change
                    case "display_lateral_movements":
                        store.dispatch(
                            "ActivitySetsStore/_updateWeakEdgeVisibility", 
                            null, { root: true }
                        );
                        break;
                }
                break;
            default:
                break;
        }
    });
}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


type ZoomParams = { 
    focalTime: Date, 
    delta: number 
}
type SnapFocusParams = { 
    time: "day" | "night", 
    direction: "backward" | "none" | "forward"
}
type ActivitySetImport = { 
    file: ActivitySetFile,
    data: ActivitySetApiData
}
type ItemFocusStateParams = { 
    beg: Date, 
    end: Date, 
    focus: boolean
}
type CollapseParams = { 
    node: ActivitySetCommonNode, 
    value: boolean 
}
type DisplayWeakEdgesParams = { 
    features: Array<keyof ActivitySetEvent>, 
    visible: boolean
}
type ActivitySetImportParams = {
    files: ActivitySetImport | ActivitySetImport[],
    refs: undefined | string | string[]
}
