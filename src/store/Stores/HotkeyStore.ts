import Features from "@/assets/rey.features";
import { HotkeyObserver } from "@/assets/scripts/WebUtilities/HotkeyObserver";
import { SettingsConfigurationError } from "../Exceptions/SettingsConfigurationError";
import type { Module } from "vuex"
import type { HotkeyStore, HotkeyItem, ModuleStore } from "../StoreTypes";

// TODO: Reintroduce hotkey container. Distribute `isHotkeyActive()` to
//       children via `provide()` and `inject()`.

export default {
    namespaced: true,
    state: {
        observer: null
    },

    getters: {

        /**
         * Returns the native hotkeys.
         * @returns
         *  The supported native hotkeys.
         */
        nativeHotkeys(): HotkeyItem[] {
            return [
                {
                    id: "copy",
                    type: "action",
                    shortcut: "Control+C",
                    allowBrowserBehavior: true
                },
                {
                    id: "cut",
                    type: "action",
                    shortcut: "Control+X",
                    allowBrowserBehavior: true
                },
                {
                    id: "paste",
                    type: "action",
                    shortcut: "Control+V",
                    allowBrowserBehavior: true
                },
                {
                    id: "refresh",
                    type: "action",
                    shortcut: "Control+R",
                    allowBrowserBehavior: true
                },
                {
                    id: "hard-refresh",
                    type: "action",
                    shortcut: "Control+Shift+R",
                    allowBrowserBehavior: true
                }
            ]
        },

        /**
         * Returns the file hotkeys.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The file hotkeys.
         */
        fileHotkeys(_s, _g, rootState): HotkeyItem[] {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let KEYS = keybindings.import_export;
            let FEATURES = Features.import_export;
            return filterHotkeys(
                [
                    {
                        id: "open_activity_set",
                        type: "file",
                        shortcut: KEYS.open_activity_set,
                    },
                    {
                        id: "add_activity_set",
                        type: "file",
                        shortcut: KEYS.add_activity_set
                    },
                    {
                        id: "add_lateral_movement",
                        type: "file",
                        shortcut: KEYS.add_lateral_movement
                    },
                    {
                        id: "import_activity_sets",
                        type: "action",
                        shortcut: KEYS.import_activity_sets,
                    },
                    {
                        id: "import_activity_set_by_id",
                        type: "action",
                        shortcut: KEYS.import_activity_set_by_id
                    },
                    {
                        id: "export_session",
                        type: "action",
                        shortcut: KEYS.export_session
                    }
                ],
                {
                    open_activity_set: FEATURES.enable_activity_set_file_open,
                    add_activity_set: FEATURES.enable_activity_set_file_open,
                    add_lateral_movement: FEATURES.enable_lateral_movement_file_open,
                    import_activity_sets: FEATURES.enable_activity_set_import_window,
                    import_activity_set_by_id: FEATURES.enable_activity_set_import_by_id,
                    export_session: FEATURES.enable_activity_set_export
                }
            );
        },

        /**
         * Returns the selection hotkeys.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The selection hotkeys.
         */
        selectionHotKeys(_s, _g, rootState): HotkeyItem[] {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let KEYS = keybindings.selection;
            return [
                {
                    id: "select_all",
                    type: "action",
                    shortcut: KEYS.select_all
                },
                {
                    id: "deselect_all",
                    type: "action",
                    shortcut: KEYS.deselect_all
                },
                {
                    id: "freeze_node",
                    type: "action",
                    shortcut: KEYS.freeze_node
                },
                {
                    id: "collapse_node",
                    type: "action",
                    shortcut: KEYS.collapse_node
                },
                {
                    id: "zoom_to_selection",
                    type: "action",
                    shortcut: KEYS.zoom_to_selection,
                },
                {
                    id: "jump_to_parent",
                    type: "action",
                    shortcut: KEYS.jump_to_parent,
                },
                {
                    id: "jump_to_children",
                    type: "action",
                    shortcut: KEYS.jump_to_children,
                },
                {
                    id: "jump_to_node",
                    type: "action",
                    shortcut: KEYS.jump_to_node
                }
            ];
        },

        /**
         * Returns the time hotkeys.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The time hotkeys.
         */
        timeHotkeys(_s, _g, rootState): HotkeyItem[] {
            let repeat = { delay: 400, interval: 50 };
            let { keybindings } = rootState.AppSettingsStore.settings;
            let KEYS = keybindings.time_focus;
            return [
                {
                    id: "snap_to_day",
                    type: "action",
                    shortcut: KEYS.snap_to_day
                },
                {
                    id: "snap_to_night",
                    type: "action",
                    shortcut: KEYS.snap_to_night
                },
                {
                    id: "jump_to_prev_night",
                    type: "action",
                    shortcut: KEYS.jump_to_prev_night,
                    repeat
                },
                {
                    id: "jump_to_prev_day",
                    type: "action",
                    shortcut: KEYS.jump_to_prev_day,
                    repeat
                },
                {
                    id: "jump_to_next_day",
                    type: "action",
                    shortcut: KEYS.jump_to_next_day,
                    repeat
                },
                {
                    id: "jump_to_next_night",
                    type: "action",
                    shortcut: KEYS.jump_to_next_night,
                    repeat
                },
                {
                    id: "nudge_time_focus_forward",
                    type: "action",
                    shortcut: KEYS.nudge_time_focus_forward,
                    repeat
                },
                {
                    id: "nudge_time_focus_backward",
                    type: "action",
                    shortcut: KEYS.nudge_time_focus_backward,
                    repeat
                },
                {
                    id: "expand_time_focus_beg",
                    type: "action",
                    shortcut: KEYS.expand_time_focus_beg,
                    repeat
                },
                {
                    id: "contract_time_focus_beg",
                    type: "action",
                    shortcut: KEYS.contract_time_focus_beg,
                    repeat
                },
                {
                    id: "contract_time_focus_end",
                    type: "action",
                    shortcut: KEYS.contract_time_focus_end,
                    repeat
                },
                {
                    id: "expand_time_focus_end",
                    type: "action",
                    shortcut: KEYS.expand_time_focus_end,
                    repeat
                }
            ];
        },

        /**
         * Returns the view hotkeys.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The view hotkeys.
         */
        viewHotkeys(_s, _g, rootState): HotkeyItem[] {
            let { settings } = rootState.AppSettingsStore;
            let KEYS = settings.keybindings.view;
            return  [
                {
                    id: "display_lateral_movements",
                    type: "action",
                    shortcut: KEYS.display_lateral_movements
                },
                {
                    id: "display_cluster_info",
                    type: "action",
                    shortcut: KEYS.display_cluster_info
                },
                {
                    id: "display_analytic_nodes",
                    type: "action",
                    shortcut: KEYS.display_analytic_nodes
                },
                {
                    id: "display_24_hour_time",
                    type: "action",
                    shortcut: KEYS.display_24_hour_time
                }
            ];
        }

    },

    actions: {

        /**
         * Reloads the app's hotkey observer.
         * @param ctx
         *  The Vuex context.
         * @throws { SettingsConfigurationError }
         *  If any hotkey sequences overlap with each other.
         */
        reloadHotkeys({ state, getters, dispatch, commit }) {
            if(state.observer === null) {
                let observer = new HotkeyObserver(
                    (id: string, data?: any) => {
                        dispatch("_fireHotKey", { id, data });
                    },
                0);
                observer.observe(document.body);
                commit("setObserver", observer);
            }
            let hotkeys = [
                ...getters.nativeHotkeys,
                ...getters.fileHotkeys, 
                ...getters.selectionHotKeys,
                ...getters.timeHotkeys,
                ...getters.viewHotkeys
            ];
            try {
                commit("setHotkeys", hotkeys);
            } catch(ex: any) {
                throw new SettingsConfigurationError(ex);
            }
        },

        /**
         * [INTERNAL USE ONLY]
         * Fires the provided hotkey.
         * @param ctx
         *  The Vuex context.
         * @param obj
         *  The hotkey event.
         */
        async _fireHotKey(ctx, { id, data }: { id: string, data?: any }) {
            let { rootState, rootGetters, dispatch } = ctx;
            let { sets } = rootState.ActivitySetsStore;
            let VIEW = rootState.AppSettingsStore.settings.view;
            switch(id) {
                case "add_activity_set":
                case "add_lateral_movement":
                case "export_session":
                    if(sets.size === 0) return;
                case "freeze_node":
                    data = { value: rootGetters["ContextMenuStore/isSelectionFrozen"] }
                    break;
                case "collapse_node":
                    data = { value: rootGetters["ContextMenuStore/isSelectionCollapsed"] };
                    break;
                case "display_24_hour_time":
                    data = { value: VIEW.app[id] };
                    break;
                case "display_lateral_movements":
                case "display_cluster_info":
                case "display_analytic_nodes":
                    data = { value: VIEW.graph[id] }
                    break;            
            }
            try {
                await dispatch(
                    "ContextMenuStore/selectMenuItem",
                    { id, data }, { root: true }
                );
            } catch(ex: any) {
                dispatch(
                    "WindowManagerStore/openExceptionWindow", 
                    { ex, src: "HotkeyStore" }, { root: true }
                )
            }
        },

        /**
         * Returns true if the provided hotkey sequence is active, false
         * otherwise.
         * @param ctx
         *  The Vuex context. 
         * @param keyParams
         *  [hotkey]
         *   The hotkey sequence to check.
         *  [strict]
         *   [true]
         *    The active keys must match the provided hotkey sequence exactly.
         *   [false]
         *    The active keys only need to contain the provided hotkey
         *    sequence.
         *   (Default: true)
         * @returns
         *  True if the provided hotkey sequence is active, false otherwise.
         */
        isHotkeyActive({ state }, keyParams: { hotkey: string, strict: boolean }): boolean {
            return state.observer?.isHotkeyActive(
                keyParams.hotkey, 
                keyParams.strict
            ) ?? false;
        }

    },

    mutations: {

        /**
         * Sets the hotkey observer.
         * @param state
         *  The Vuex state.
         * @param observer
         *  The hotkey observer.
         */
        setObserver(state, observer: HotkeyObserver) {
            state.observer = observer;
        },

        /**
         * Sets the hotkey observer's currently active hotkeys.
         * @param state
         *  The Vuex state.
         * @param hotkeys
         *  The hotkeys to load.
         * @throws { OverlappingHotkeysError }
         *  If any hotkey sequences overlap with each other.
         */
        setHotkeys(state, hotkeys: HotkeyItem[]) {
            state.observer?.setHotkeys(hotkeys);
        }

    }

} as Module<HotkeyStore, ModuleStore>

/**
 * Filters disabled hotkeys from an array of HotkeyItems.
 * @param hotkeys
 *  The hotkey items to filter.
 * @param features
 *  The features to enable / disable (specified by id).
 * @returns
 *  The filtered hotkey items.
 */
function filterHotkeys(
    hotkeys: HotkeyItem[], features: { [key: string]: boolean }
): HotkeyItem[] {
    return hotkeys.filter(hotkey => !(hotkey.id in features) || features[hotkey.id])
}
