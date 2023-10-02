import Features from "@/assets/rey.features.js";
import { Module } from "vuex"
import { Timeframe } from "@/assets/scripts/Collections/Timeframe";
import { ActivitySetEvent } from "@/assets/scripts/ViewData/ActivitySetFileTypes";
import { InvalidTimelineSortError } from "../Exceptions/InvalidTimelineSortError";
import { InvalidDayNightModeError } from "../Exceptions/InvalidDayNightModeError";
import { InvalidNudgeIntervalError } from "../Exceptions/InvalidNudgeIntervalError";
import { InvalidTimelineBreakoutError } from "../Exceptions/InvalidTimelineBreakoutError";
import { 
    SortFeature,
    ModuleStore, 
    AppSettings,
    AppSettingsStore, 
    AppDisplaySetting,
    AppearanceSetting,
    GraphViewDisplaySetting
} from "@/store/StoreTypes";

export default {
    namespaced: true,
    state: {
        settings: {
            apis: {
                activity_set_import_api: "",
                activity_set_import_lm_api: "",
                activity_set_import_search_api: "",
                activity_set_import_filters_api: "",
                activity_set_classification_api: "",
                activity_set_group_matching_api: ""
            },
            view: {
                app: {
                    display_24_hour_time: false,
                    display_day_night_highlighting: true,
                    appearance: {
                        timeline: true
                    }
                },
                graph: {
                    render_high_quality: true,
                    display_lateral_movements: false,
                    display_cluster_info: false,
                    display_analytic_nodes: false,
                    active_clustering_features: []
                },
                timeline: {
                    breakout_feature: null,
                    sort_feature: "time",
                    stack_car_types: false
                },
            },
            time: {
                nudge_interval: "",
                day_night_mode: "",
            },
            keybindings: {
                import_export: {
                    open_activity_set: "",
                    add_activity_set: "",
                    add_lateral_movement: "",
                    import_activity_sets: "",
                    import_activity_set_by_id: "",
                    export_session: ""
                },
                selection: {
                    traceback: "",
                    multi_select: "",
                    select_all: "",
                    deselect_all: "",
                    freeze_node: "",
                    collapse_node: "",
                    zoom_to_selection: "",
                    jump_to_parent: "",
                    jump_to_children: "",
                    jump_to_node: ""
                },
                time_focus: {
                    snap_to_day: "",
                    snap_to_night: "",
                    jump_to_prev_night: "",
                    jump_to_prev_day: "",
                    jump_to_next_day: "",
                    jump_to_next_night: "",
                    nudge_time_focus_forward: "",
                    nudge_time_focus_backward: "",
                    expand_time_focus_beg: "",
                    expand_time_focus_end: "",
                    contract_time_focus_beg: "",
                    contract_time_focus_end: "",
                },
                view: {
                    display_lateral_movements: "",
                    display_cluster_info: "",
                    display_analytic_nodes: "",
                    display_24_hour_time: ""
                }
            },
            file_classes: {
                text: new Set(),
                image: new Set(),
                audio: new Set(),
                video: new Set(),
                archive: new Set(),
                executable: new Set(),
                spreadsheet: new Set()
            }
        },
        active_day_night_mode: {
            id: "__base_day_night_mode",
            timeframe: new Timeframe(
                new Date(72000000),
                new Date(28800000)
            )
        },
        active_nudge_interval: {
            id: "__base_nudge_interval",
            time: 0
        },
        active_timeline_breakout: {
            id: "__base_timeline_breakout",
            key: "attack_tactic",
            on: "analytic"
        },
        active_timeline_sort: {
            id: "time"
        }
    },

    actions: {

        /**
         * Loads the app's default settings into the store.
         * @param ctx
         *  The Vuex context.
         * @throws { InvalidDayNightModeError }
         *  If the day / night mode id is not defined in the feature file or if
         *  the resolved mode is configured with an invalid timeframe.
         * @throws { InvalidNudgeIntervalError }
         *  If the nudge interval id is not defined in the feature file.
         * @throws { InvalidTimelineBreakoutError }
         *  If the breakout feature id is not defined in the feature file or if
         *  the resolved breakout is configured with an invalid breakout object.
         * @throws { InvalidTimelineSortError }
         *  If the sort feature is invalid.
         * @throws { SettingsConfigurationError }
         *  If any hotkey sequences overlap with each other.
         */
        async loadAppSettings({ commit, dispatch, state }) {
            let settings = await (await fetch("./settings.json")).json();
            // Wrap file classes
            let fc = settings.file_classes;
            fc.text = new Set(fc.text);
            fc.image = new Set(fc.image);
            fc.audio = new Set(fc.audio);
            fc.video = new Set(fc.video);
            fc.archive = new Set(fc.archive);
            fc.executable = new Set(fc.executable);
            fc.spreadsheet = new Set(fc.spreadsheet);
            // Load settings
            commit("loadSettings", settings);
            await dispatch("setDayNightMode", state.settings.time.day_night_mode);
            await dispatch("setNudgeInterval", state.settings.time.nudge_interval);
            await dispatch("setTimelineSort", state.settings.view.timeline.sort_feature);
            await dispatch("setTimelineBreakout", state.settings.view.timeline.breakout_feature);
            // Reload hotkeys
            await dispatch("HotkeyStore/reloadHotkeys", null, { root: true });
        },

        /**
         * Shows / Hides the timeline.
         * @param ctx
         *  The Vuex context.
         * @param value
         *  [true]
         *   Show the timeline.
         *  [false]
         *   Hide the timeline.
         */
        showTimeline({ commit }, value: boolean) {
            commit("setAppearanceSetting", { id: "timeline", value });
        },

        /**
         * Sets the specified app setting's value.
         * @param ctx
         *  The Vuex context.
         * @param settingParams
         *  [id]
         *   The id of the app setting to change.
         *  [value]
         *   The setting's new value. 
         */
        setAppDisplaySetting({ commit, dispatch }, settingParams: SetAppDisplayParams) {
            commit("setAppDisplaySetting", settingParams);
        },

        /**
         * Sets the specified graph setting's value.
         * @param ctx
         *  The Vuex context.
         * @param settingParams
         *  [id]
         *   The id of the graph setting to change.
         *  [value]
         *   The setting's new value. 
         */
        setGraphViewDisplaySetting({ commit, dispatch }, settingParams: SetGraphViewDisplayParams) {
            commit("setGraphViewDisplaySetting", settingParams);
        },

        /**
         * Enables / Disables a cluster feature.
         * @param ctx
         *  The Vuex context.
         * @param clusterParams
         *  [feature]
         *   The cluster feature to enable / disable.
         *  [enabled]
         *   The enabled state. (true = enabled, false = disabled) 
         */
        enableClusterFeature({ commit }, clusterParams: ClusterFeatureParams) {
            commit("enableClusterFeature", clusterParams);
        },

        /**
         * Sets the day / night mode.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the day / night mode.
         * @throws { InvalidDayNightModeError }
         *  If `id` is not defined in the feature file or if the resolved mode
         *  is configured with an invalid timeframe.
         */
        setDayNightMode({ commit }, id: string) {
            let modes = Features.time.day_night_modes;
            // Lookup mode
            let mode = modes.find(o => o.id === id);
            if(!mode) {
                throw new InvalidDayNightModeError(
                    `Missing Day/Night Mode Definition`,
                    `A day/night mode with the id '${ 
                        id
                    }' is not defined in the feature file.`,
                    { mode: id }
                )
            }
            // Parse time
            let hmsBeg = mode.day_beg.split(/:/)
                .map(n => parseInt(n));
            let hmsEnd = mode.day_end.split(/:/)
                .map(n => parseInt(n));
            // Generate timeframe
            let beg = new Date();
            beg.setHours(hmsBeg[0]);
            beg.setMinutes(hmsBeg[1]);
            beg.setSeconds(hmsBeg[2]);
            let end = new Date();
            end.setHours(hmsEnd[0]);
            end.setMinutes(hmsEnd[1]);
            end.setSeconds(hmsEnd[2]);
            // Validate timeframe
            if(Number.isNaN(beg.getTime() && end.getTime())) {
                throw new InvalidDayNightModeError(
                    `Invalid Day/Night Mode Timeframe`,
                    `The timeframe defined by the day/night mode '${
                        id
                    }' is invalid.`,
                    { 
                        mode: id, 
                        day_beg: mode.day_beg, 
                        day_end: mode.day_end
                    }
                );
            }
            // Set day / night mode
            commit("setDayNightMode", { 
                id, timeframe: new Timeframe(beg, end)
            });
        },

        /**
         * Sets the nudge interval.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the nudge interval.
         * @throws { InvalidNudgeIntervalError }
         *  If `id` is not defined in the feature file.
         */
        setNudgeInterval({ commit }, id: string) {
            let intervals = Features.time.nudge_intervals;
            // Lookup interval
            let interval = intervals.find(o => o.id === id);
            if(!interval) {
                throw new InvalidNudgeIntervalError(
                    `Missing Nudge Interval Definition`,
                    `A nudge interval with the id '${ 
                        id
                    }' is not defined in the feature file.`,
                    { interval: id }
                )
            }
            // Set nudge interval
            commit("setNudgeInterval", { id, time: interval.time })
        },

        /**
         * Sets the timeline breakout feature.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the breakout feature.
         * @throws { InvalidTimelineBreakoutError }
         *  If `id` is not defined in the feature file or if the resolved
         *  breakout is configured with an invalid breakout object. 
         */
        setTimelineBreakout({ commit }, id: string) {
            let features = Features.activity_set_timeline.breakout_features;
            // Lookup breakout
            let feature = features.find(o => o.id === id);
            if(!feature) {
                throw new InvalidTimelineBreakoutError(
                    `Missing Timeline Breakout Definition`,
                    `A breakout feature with the id '${ 
                        id 
                    }' is not defined in the feature file.`,
                    { feature: id }
                );
            }
            // Validate breakout
            if(!["event", "analytic"].includes(feature.on)) {
                throw new InvalidTimelineBreakoutError(
                    "Invalid Timeline Breakout Object Configured",
                    `A breakout object of type '${ 
                        feature.on
                    }' does not exist. Options include 'analytic' and 'event'.`,
                    { id, on: feature.on }
                )
            }
            // Set breakout
            commit("setTimelineBreakout", { 
                id, key: feature.key, on: feature.on
            });
        },

        /**
         * Sets the timeline sort feature.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the sort feature.
         * @throws { InvalidTimelineSortError }
         *  If `id` is an invalid sort feature.
         */
        setTimelineSort({ commit }, id) {
            if(["time", "name"].includes(id)) {
                commit("setTimelineSort", id);
            } else {
                throw new InvalidTimelineSortError(
                    "Invalid Timeline Sort Feature Selected",
                    `Lanes cannot be sorted by '${ 
                        id 
                    }'. Options include 'name' and 'time'.`,
                    { sort: id }
                );
            }
        },

        /**
         * Stacks / Unstacks events based on CAR type.
         * @param ctx
         *  The Vuex context.
         * @param value
         *  [true]
         *   Stack differing CAR types.
         *  [false]
         *   Unstack differing CAR types.
         */
        setTimelineStackCarTypes({ commit }, value: boolean) {
            commit("setTimelineStackCarTypes", value);
        }

    },
    
    mutations: {

        /**
         * Sets the app's settings configuration.
         * @param state
         *  The Vuex state.
         * @param settings
         *  The settings configuration.
         */
        loadSettings(state, settings: AppSettings) {
            state.settings = settings;
        },

        /**
         * Sets the specified appearance setting.
         * @param state
         *  The Vuex state.
         * @param settingParams
         *  [id]
         *   The id of the appearance setting to change.
         *  [value]
         *   The setting's new value. 
         */
        setAppearanceSetting(state, { id, value }: SetAppearanceParams) {
            state.settings.view.app.appearance[id] = value;
        },

        /**
         * Sets the specified app setting's value.
         * @param state
         *  The Vuex state.
         * @param settingParams
         *  [id]
         *   The id of the app setting to change.
         *  [value]
         *   The setting's new value. 
         */
        setAppDisplaySetting(state, { id, value }: SetAppDisplayParams) {
            state.settings.view.app[id] = value;
        },

        /**
         * Sets the specified graph setting's value.
         * @param state
         *  The Vuex state.
         * @param settingParams
         *  [id]
         *   The id of the graph setting to change.
         *  [value]
         *   The setting's new value. 
         */
        setGraphViewDisplaySetting(state, { id, value }: SetGraphViewDisplayParams) {
            state.settings.view.graph[id] = value;
        },

        /**
         * Enables / Disables a cluster feature.
         * @param state
         *  The Vuex state.
         * @param clusterParams
         *  [feature]
         *   The cluster feature to enable / disable.
         *  [enabled]
         *   The enabled state. (true = enabled, false = disabled) 
         */
        enableClusterFeature(state, { feature, enabled }: ClusterFeatureParams) {
            let features = state.settings.view.graph.active_clustering_features;
            let featureIdx = features.indexOf(feature);
            if(enabled && featureIdx === -1) {
                features.push(feature);
            } else if(!enabled && featureIdx !== -1) {
                features.splice(featureIdx, 1);
            }
        },

        /**
         * Sets the day / night mode.
         * @param state
         *  The Vuex state.
         * @param id
         *  [id]
         *   The id of the day / night mode.
         *  [timeframe]
         *   The day / night mode's timeframe.
         */
        setDayNightMode(state, { id, timeframe }: DayNightModeParams) {
            state.active_day_night_mode.id = id;
            state.active_day_night_mode.timeframe = timeframe;
        },

        /**
         * Sets the nudge interval.
         * @param state
         *  The Vuex state.
         * @param nudgeParams
         *  [id]
         *   The id of the nudge interval.
         *  [time]
         *   The nudge interval's duration in milliseconds.
         */
        setNudgeInterval(state, { id, time }: NudgeIntervalParams) {
            state.active_nudge_interval.id = id;
            state.active_nudge_interval.time = time;
        },

        /**
         * Sets the timeline breakout feature.
         * @param state
         *  The Vuex state.
         * @param breakoutParams
         *  [id]
         *   The timeline breakout id.
         *  [key]
         *   The timeline breakout feature.
         *  [on]
         *   The timeline breakout object.
         */
        setTimelineBreakout(state, { id, key, on }: TimelineBreakoutParams) {
            state.active_timeline_breakout.id = id;
            state.active_timeline_breakout.key = key;
            state.active_timeline_breakout.on = on;
        },

        /**
         * Sets the timeline sort feature.
         * @param state
         *  The Vuex state.
         * @param sort
         *  The timeline sort feature.
         */
        setTimelineSort(state, sort: SortFeature) {
            state.active_timeline_sort.id = sort;
        },

        /**
         * Sets the stack type for timeline events.
         * @param state
         *  The Vuex state.
         * @param value
         *  [true]
         *   Stack differing CAR types.
         *  [false]
         *   Unstack differing CAR types.
         */
        setTimelineStackCarTypes(state, value: boolean) {
            state.settings.view.timeline.stack_car_types = value;
        }

    }
} as Module<AppSettingsStore, ModuleStore>


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


type SetAppearanceParams = {
    id: AppearanceSetting, 
    value: boolean
}
type SetAppDisplayParams = {
    id: AppDisplaySetting,
    value: boolean
}
type SetGraphViewDisplayParams = {
    id: GraphViewDisplaySetting,
    value: boolean
}
type ClusterFeatureParams = {
    feature: keyof ActivitySetEvent,
    enabled: boolean
}
type DayNightModeParams = {
    id: string, 
    timeframe: Timeframe
}
type NudgeIntervalParams = {
    id: string,
    time: number
}
type TimelineBreakoutParams = {
    id: string,
    key: string,
    on: "event" | "analytic"
}
