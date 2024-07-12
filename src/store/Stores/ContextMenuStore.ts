import Features from "@/assets/rey.features";
import { titleCase } from "@/assets/scripts/String"
import type { Module } from "vuex";
import type { ActivitySetEvent } from "@/assets/scripts/ViewData/ActivitySetFileTypes";
import type { 
    ModuleStore,
    ContextMenuItem,
    ContextMenuStore,
    AppDisplaySetting,
    ContextMenuSection,
    GraphViewDisplaySetting
} from "../StoreTypes";

export default {
    namespaced: true,
    getters: {


        ///////////////////////////////////////////////////////////////////////
        //  1. File Menu  /////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the file menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The file menu.
         */
        fileMenu(_s, _g, rootState): ContextMenuItem | null {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let { sets } = rootState.ActivitySetsStore;
            let KEYS = keybindings.import_export;
            let FEATURES = Features.import_export;
            return filterMenuOptions(
                {
                    id: "file_menu",
                    text: "File",
                    type: "submenu",
                    sections: [
                        {
                            id: "open_file_options",
                            items: [
                                {
                                    id: "open_activity_set",
                                    text: "Open Activity Set File...",
                                    type: "file",
                                    shortcut: KEYS.open_activity_set,
                                }
                            ]
                        },
                        {
                            id: "add_file_options",
                            items: [
                                {
                                    id: "add_activity_set",
                                    text: "Add Activity Set File...",
                                    type: "file",
                                    shortcut: KEYS.add_activity_set,
                                    disabled: 0 === sets.size,
                                },
                                {
                                    id: "add_lateral_movement",
                                    text: "Add Lateral Movement File...",
                                    type: "file",
                                    shortcut: KEYS.add_lateral_movement,
                                    disabled: 0 === sets.size,
                                }
                            ]
                        },
                        {
                            id: "api_import_options",
                            items: [
                                {
                                    id: "import_activity_sets",
                                    text: "Import Activity Sets...",
                                    type: "action",
                                    shortcut: KEYS.import_activity_sets,
                                },
                                {
                                    id: "import_activity_set_by_id",
                                    text: "Import Activity Set by ID...",
                                    type: "action",
                                    shortcut: KEYS.import_activity_set_by_id
                                }
                            ]
                        },
                        {
                            id: "export_options",
                            items: [
                                {
                                    id: "export_session",
                                    text: "Export...",
                                    type: "action",
                                    shortcut: KEYS.export_session,
                                    disabled: 0 === sets.size,
                                }
                            ]
                        }
                    ]
                },
                {
                    open_activity_set: FEATURES.enable_activity_set_file_open,
                    add_activity_set: FEATURES.enable_activity_set_file_open,
                    add_lateral_movement: FEATURES.enable_lateral_movement_file_open,
                    import_activity_sets: FEATURES.enable_activity_set_import_window,
                    import_activity_set_by_id: FEATURES.enable_activity_set_import_by_id,
                    export_options: FEATURES.enable_activity_set_export,
                }
            );
        },

        
        ///////////////////////////////////////////////////////////////////////
        //  2. Selection Menus  ///////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the selection menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param getters
         *  The Vuex getters.
         * @returns
         *  The selection menu.
         */
        selectionMenu(_s, getters): ContextMenuItem {
            return {
                id: "selection_menu",
                text: "Selection",
                type: "submenu",
                sections: [
                    ...getters.itemSelectionSubmenu.sections,
                    getters.jumpToNodeMenuSection,
                    { 
                        id: "mass_selection_options", 
                        items: [
                            ...getters.massSelectionMenuSection.items,
                            ...getters.massDeselectionMenuSection.items,
                        ] 
                    }
                ]
            }
        },

        /**
         * Returns the item selection submenu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param getters
         *  The Vuex getters.
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The item selection submenu.
         */
        itemSelectionSubmenu(_s, getters, rootState): ContextMenuItem {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let { selected } = rootState.ActivitySetsStore;
            let KEYS = keybindings.selection;
            let PLURALIZE = selected.size > 1 ? "s" : "";
            return filterMenuOptions({
                id: "item_selection_menu",
                text: "Item Selection",
                type: "submenu",
                sections: [
                    {
                        id: "traceback",
                        items: [
                            {
                                id: "traceback_selection",
                                text: "Traceback",
                                type: "action",
                                shortcut: `${ KEYS.traceback }+Click Node`,
                                disabled: selected.size === 0,
                            }
                        ]
                    },
                    {
                        id: "edit_node_options",
                        items: [
                            {
                                id: "freeze_node",
                                text: `Freeze Node${ PLURALIZE }`,
                                type: "toggle",
                                shortcut: KEYS.freeze_node,
                                disabled: selected.size === 0,
                                value: getters.isSelectionFrozen
                            },
                            {
                                id: "collapse_node",
                                text: `Collapse Node${ PLURALIZE }`,
                                type: "toggle",
                                shortcut: KEYS.collapse_node,
                                disabled: selected.size === 0,
                                value: getters.isSelectionCollapsed
                            }
                        ]
                    },
                    getters.selectionLinksMenuSection,
                    {
                        id: "camera_options",
                        items: [
                            {
                                id: "zoom_to_selection",
                                text: "Zoom to Selection",
                                type: "action",
                                shortcut: KEYS.zoom_to_selection,
                                disabled: selected.size === 0,
                            },
                            {
                                id: "jump_to_parent",
                                text: "Jump to Node Parent",
                                type: "action",
                                shortcut: KEYS.jump_to_parent,
                                disabled: selected.size === 0,
                            },
                            {
                                id: "jump_to_children",
                                text: "Jump to Node Children",
                                type: "action",
                                shortcut: KEYS.jump_to_children,
                                disabled: selected.size === 0,
                            }
                        ]
                    }
                ]
            })!;
        },

        /**
         * Returns the selection links menu section.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The selection links menu section.
         */
        selectionLinksMenuSection(_s, _g, rootState): ContextMenuSection {
            type MenuLink = { 
                text    : string, 
                enabled : (total: number) => boolean, 
                url     : (ids: string[]) => string
            }
            // Format link options
            let items: ContextMenuItem[] = [];
            let links: MenuLink[] = Features.selection.context_menu_links;
            let { selected } = rootState.ActivitySetsStore;
            for(let link of links) {
                items.push({
                    id: "open_selection_link",
                    text: link.text,
                    type: "link",
                    disabled: !link.enabled.call(null, selected.size),
                    link: link.url.call(null, [...selected.keys()])
                });
            }
            // Return menu section
            return { id: "selection_links", items };
        },

        /**
         * Returns the jump to node menu section.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The jump to node menu section.
         */
         jumpToNodeMenuSection(_s, _g, rootState): ContextMenuSection {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let KEYS = keybindings.selection;
            return { 
                id: "jump_to_node_options", 
                items: [
                    {
                        id: "jump_to_node",
                        text: "Jump to Node...",
                        type: "action",
                        shortcut: KEYS.jump_to_node,
                    }
                ] 
            }
        },

        /**
         * Returns the mass selection menu section.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The mass selection menu section.
         */
        massSelectionMenuSection(_s, _g, rootState): ContextMenuSection {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let KEYS = keybindings.selection;
            return { 
                id: "mass_selection_options", 
                items: [
                    {
                        id: "select_all",
                        text: "Select All",
                        type: "action",
                        shortcut: KEYS.select_all,
                    }
                ] 
            }
        },

        /**
         * Returns the mass deselection menu section.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The mass deselection menu section.
         */
        massDeselectionMenuSection(_s, _g, rootState): ContextMenuSection {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let KEYS = keybindings.selection;
            return { 
                id: "mass_deselection_options", 
                items: [
                    {
                        id: "deselect_all",
                        text: "Deselect All",
                        type: "action",
                        shortcut: KEYS.deselect_all,
                    }
                ] 
            }
        },


        ///////////////////////////////////////////////////////////////////////
        //  3. Time Menus  ////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the time menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param getters
         *  The Vuex getters.
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The time menu.
         */
        timeMenu(_s, getters, rootState): ContextMenuItem {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let KEYS = keybindings.time_focus;
            return filterMenuOptions({
                id: "time_menu",
                text: "Time",
                type: "submenu",
                sections: [
                    {
                        id: "day_night_modes_submenu",
                        items: [getters.dayNightModesSubmenu]
                    },
                    ...getters.snapFocusSubmenu.sections,
                    {
                        id: "nudge_intervals_submenu",
                        items: [getters.nudgeIntervalsSubmenu]
                    },
                    {
                        id: "nudge_time_focus",
                        items: [
                            {
                                id: "nudge_time_focus_forward",
                                text: "Nudge Focus Forward",
                                type: "action",
                                shortcut: KEYS.nudge_time_focus_forward
                            },
                            {
                                id: "nudge_time_focus_backward",
                                text: "Nudge Focus Backward",
                                type: "action",
                                shortcut: KEYS.nudge_time_focus_backward
                            }
                        ]
                    },
                    {
                        id: "resize_time_focus",
                        items: [
                            {
                                id: "expand_time_focus_beg",
                                text: "Nudge Start Time Forwards",
                                type: "action",
                                shortcut: KEYS.expand_time_focus_beg
                            },
                            {
                                id: "contract_time_focus_beg",
                                text: "Nudge Start Time Backwards",
                                type: "action",
                                shortcut: KEYS.contract_time_focus_beg
                            },
                            {
                                id: "contract_time_focus_end",
                                text: "Nudge End Time Backwards",
                                type: "action",
                                shortcut: KEYS.contract_time_focus_end
                            },
                            {
                                id: "expand_time_focus_end",
                                text: "Nudge End Time Forwards",
                                type: "action",
                                shortcut: KEYS.expand_time_focus_end
                            }
                        ]
                    }
                ]
            })!;
        },

        /**
         * Returns the day / night modes submenu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The day / night modes submenu.
         */
        dayNightModesSubmenu(_s, _g, rootState): ContextMenuItem { 
            type Modes = Array<{ 
                id      : string;
                text    : string, 
                day_beg : string | null,
                day_end : string | null,
            }>;
            // Format mode options
            let items: ContextMenuItem[] = [];
            let modes: Modes = Features.time.day_night_modes;
            let { id } = rootState.AppSettingsStore.active_day_night_mode;
            for(let mode of modes) {
                items.push({
                    id: "set_day_night_mode",
                    text: mode.text,
                    type: "toggle",
                    value: mode.id === id,
                    data: { id: mode.id }
                })
            }
            // Return submenu
            return {
                id: "day_night_mode",
                text: "Set Day / Night to...",
                type: "submenu",
                sections: [
                    { id: "day_night_modes", items }
                ]
            }
        },

        /**
         * Returns the snap focus submenu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The snap focus submenu.
         */
        snapFocusSubmenu(_s, _g, rootState): ContextMenuItem {
            let { keybindings } = rootState.AppSettingsStore.settings;
            let KEYS = keybindings.time_focus;
            return {
                id: "snap_time_menu",
                text: "Snap time to...",
                type: "submenu",
                sections: [
                    {
                        id: "snap_time_focus",
                        items: [
                            {
                                id: "snap_to_day",
                                text: "Snap to Current Day",
                                type: "action",
                                shortcut: KEYS.snap_to_day
                            },
                            {
                                id: "snap_to_night",
                                text: "Snap to Current Night",
                                type: "action",
                                shortcut: KEYS.snap_to_night
                            }
                        ]
                    },
                    {
                        id: "shift_time_focus",
                        items: [
                            {
                                id: "jump_to_prev_night",
                                text: "Snap to Previous Night",
                                type: "action",
                                shortcut: KEYS.jump_to_prev_night
                            },
                            {
                                id: "jump_to_prev_day",
                                text: "Snap to Previous Day",
                                type: "action",
                                shortcut: KEYS.jump_to_prev_day
                            },
                            {
                                id: "jump_to_next_day",
                                text: "Snap to Next Day",
                                type: "action",
                                shortcut: KEYS.jump_to_next_day
                            },
                            {
                                id: "jump_to_next_night",
                                text: "Snap to Next Night",
                                type: "action",
                                shortcut: KEYS.jump_to_next_night
                            }
                        ]
                    }
                ]
            }
        },

        /**
         * Returns the nudge interval submenu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The nudge interval submenu.
         */
        nudgeIntervalsSubmenu(_s, _g, rootState): ContextMenuItem {
            type Intervals = Array<{ 
                id      : string;
                text    : string, 
                time    : number
            }>;
            // Format interval options
            let items: ContextMenuItem[] = [];
            let intervals: Intervals = Features.time.nudge_intervals;
            let { id } = rootState.AppSettingsStore.active_nudge_interval;
            for(let interval of intervals) {
                items.push({
                    id: "set_nudge_interval",
                    text: interval.text,
                    type: "toggle",
                    value: interval.id === id,
                    data: { interval: interval.id }
                })
            }
            // Return submenu
            return  {
                id: "nudge_interval",
                text: "Nudge Focus by...",
                type: "submenu",
                sections: [
                    { id: "nudge_intervals", items }
                ]
            }
        },

        
        ///////////////////////////////////////////////////////////////////////
        //  4. View Menus  ////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the view menu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param getters
         *  The Vuex getters.
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The view menu.
         */
        viewMenu(_s, getters, rootState): ContextMenuItem {
            let { settings } = rootState.AppSettingsStore;
            let VIEW = settings.view;
            let KEYS = settings.keybindings.view;
            let APPEARANCE = VIEW.app.appearance;
            return {
                id: "view_menu",
                text: "View",
                type: "submenu",
                sections: [
                    ...getters.graphViewSubmenu.sections,
                    {
                        id: "app_display",
                        items: [
                            {
                                id: "display_24_hour_time",
                                text: "24 Hour Time",
                                type: "toggle",
                                shortcut: KEYS.display_24_hour_time,
                                value: VIEW.app.display_24_hour_time,
                            }
                        ]
                    },
                    {
                        id: "appearance",
                        items: [
                            {
                                id: "show_timeline",
                                text: "Show Timeline",
                                type: "toggle",
                                value: APPEARANCE.timeline
                            }
                        ]
                    }
                ]
            }
        },

        /**
         * Returns the graph view submenu.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  The graph view submenu.
         */
        graphViewSubmenu(_s, _g, rootState): ContextMenuItem | null {
            // Features
            let { clustering_features: cf } = Features.activity_set_graph;
            let ClusterFeatures = cf as Array<keyof ActivitySetEvent>;
            // Settings
            let { settings } = rootState.AppSettingsStore;
            let KEYS = settings.keybindings.view;
            let VIEW = settings.view;
            let ACF = VIEW.graph.active_clustering_features;
            // Submenu
            return filterMenuOptions({
                id: "graph_view_options",
                text: "Graph View",
                type: "submenu",
                sections: [
                    {
                        id: "rendering_quality",
                        items: [
                            {
                                id: "enable_high_quality_render",
                                text: "Graph Rendering – High Quality",
                                type: "toggle",
                                value: VIEW.graph.render_high_quality,
                            },
                            {
                                id: "enable_low_quality_render",
                                text: "Graph Rendering – Fast",
                                type: "toggle",
                                value: !VIEW.graph.render_high_quality,
                            }
                        ]
                    },
                    {
                        id: "cluster_by_submenu",
                        items: [
                            {
                                id: "cluster_by_options",
                                text: "Cluster Events by...",
                                type: "submenu",
                                sections: [
                                    {
                                        id: "cluster_options",
                                        items: ClusterFeatures.map(feat => ({
                                            id: "cluster_by",
                                            text: titleCase(feat),
                                            type: "toggle",
                                            value: ACF.includes(feat),
                                            data: { feature: feat }
                                        }))
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "view_options",
                        items: [
                            {
                                id: "display_cluster_info",
                                text: "Display Cluster Information",
                                type: "toggle",
                                shortcut: KEYS.display_cluster_info,
                                value: VIEW.graph.display_cluster_info,
                            },
                            {
                                id: "display_lateral_movements",
                                text: "Display Lateral Movements",
                                type: "toggle",
                                shortcut: KEYS.display_lateral_movements,
                                value: VIEW.graph.display_lateral_movements,
                            },
                            {
                                id: "display_analytic_nodes",
                                text: "Display Analytics Nodes",
                                type: "toggle",
                                shortcut: KEYS.display_analytic_nodes,
                                value: VIEW.graph.display_analytic_nodes,
                            }
                        ]
                    }
                ]
            })
        },

        
        ///////////////////////////////////////////////////////////////////////
        //  5. Help Menu  /////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns the help menu.
         * @returns
         *  The help menu.
         */
        helpMenu(): ContextMenuItem {
            return {
                id: "help_menu",
                text: "Help",
                type: "submenu",
                sections: [
                    {
                        id: "documentation",
                        items: [
                            {
                                id: "link_documentation",
                                text: "Documentation",
                                type: "link",
                                link: Features.links.documentation_url,
                            },
                            {
                                id: "link_changelog",
                                text: "Change Log",
                                type: "link",
                                link: Features.links.changelog_url,
                            },
                        ]
                    },
                    {
                        id: "about",
                        items: [
                            {
                                id: "open_about_window",
                                text: "About",
                                type: "action",
                            },
                        ]
                    }
                ]
            };
        },


        ///////////////////////////////////////////////////////////////////////
        //  6. Helpers  ///////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Returns true if the current selection is collapsed, false otherwise.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  True if the current selection is collapsed, false otherwise.
         */
        isSelectionCollapsed(_s, _g, rootState): boolean {
            let { selected } = rootState.ActivitySetsStore;
            let { collapsed } = rootState.ActivitySetsStore;
            let isCollapsed = false;
            for(let item of selected.values()) {
                isCollapsed = collapsed.has(item.id);
                if(isCollapsed) break;
            }
            return isCollapsed;
        },
      
        /**
         * Returns true if the current selection is frozen, false otherwise.
         * @param _s
         *  The Vuex state. (Unused)
         * @param _g
         *  The Vuex getters. (Unused)
         * @param rootState
         *  The Vuex root state.
         * @returns
         *  True if the current selection is frozen, false otherwise.
         */
        isSelectionFrozen(_s, _g, rootState): boolean {
            let { selected } = rootState.ActivitySetsStore;
            let { frozen } = rootState.ActivitySetNetworkStore;
            let isFrozen = false;
            for(let item of selected.values()) {
                isFrozen = frozen.has(item.id);
                if(isFrozen) break;
            }
            return isFrozen;
        }

    },

    actions: {

        /**
         * Dispatches a menu item selection.
         * @param ctx
         *  The Vuex Context.
         * @param selectParams
         *  [id]
         *   The id of the selected menu item.
         *  [data]
         *   Auxillary data included with the selection.
         * @throws { ActivitySetApiError }
         *  Refer to: `ActivitySetImporter/importActivitySetFile`
         * @throws { MalformedActivitySetError }
         *  Refer to: `ActivitySetImporter/importActivitySetFile`
         * @throws { MalformedLateralMovementError }
         *  Refer to: `ActivitySetsStore/importLateralMovementFile`
         * @throws { InvalidDayNightModeError }
         *  Refer to: `AppSettingsStore/setDayNightMode`
         * @throws { InvalidNudgeIntervalError }
         *  Refer to: `AppSettingsStore/setNudgeInterval`
         */
        async selectMenuItem({ dispatch, rootState }, { id, data }: { id: string, data: any }) {
            let selection;
            let o = { root: true };
            switch(id) {
          
                ///////////////////////////////////////////////////////////////
                //  1. Import & Export  ///////////////////////////////////////
                ///////////////////////////////////////////////////////////////

                case "open_activity_set":
                    await dispatch(
                        "ActivitySetsStore/dumpSession",
                        null, o
                    );
                case "add_activity_set":
                    await dispatch(
                        "ActivitySetImporter/importActivitySetFile",
                        data.file, o
                    );
                    break;
                case "add_lateral_movement":
                    await dispatch(
                        "ActivitySetImporter/importLateralMovementFile", 
                        data.file, o
                    );
                    break;
                case "import_activity_sets":
                    await dispatch(
                        "WindowManagerStore/openSetImportWindow",
                        null, o
                    );
                    break;
                case "import_activity_set_by_id":
                    await dispatch(
                        "WindowManagerStore/openSetImportByIdWindow",
                        null, o
                    );
                    break;
                case "export_session":
                    await dispatch(
                        "ActivitySetImporter/exportSessionAsJson",
                        null, o
                    );
                    break;
                
                ///////////////////////////////////////////////////////////////
                //  2. Selection  /////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////
                
                case "select_all":
                    await dispatch(
                        "ActivitySetsStore/selectAllNodes",
                        id, o
                    );
                    break;
                case "deselect_all":
                    await dispatch(
                        "ActivitySetsStore/unselectAll",
                        null, o
                    );
                    break;
                case "traceback_selection":
                    selection = [...rootState.ActivitySetsStore.selected.keys()];
                    for(let id of selection) {
                        await dispatch(
                            "ActivitySetsStore/selectTraceback",
                            id, o
                        );
                    }
                    break;
                case "freeze_node":
                    selection = rootState.ActivitySetsStore.selected.keys();
                    for(let id of selection) {
                        await dispatch(
                            "ActivitySetNetworkStore/setNodeFreeze",
                            { id, value: !data.value }, o
                        );
                    }
                    break;
                case "collapse_node":
                    selection = rootState.ActivitySetsStore.selected.keys();
                    for(let id of selection) {
                        await dispatch(
                            "ActivitySetsStore/setNodeCollapse", 
                            { id, value: !data.value }, o
                        );
                    }
                    break;
                case "jump_to_parent":
                case "jump_to_children":
                    if(id === "jump_to_parent") {
                        await dispatch(
                            "ActivitySetsStore/shiftSelectionToParents", 
                            null, o
                        );
                    } else {
                        await dispatch(
                            "ActivitySetsStore/shiftSelectionToChildren",
                            null, o
                        );
                    }
                case "zoom_to_selection":
                    await dispatch(
                        "ActivitySetsStore/triggerCameraFocus",
                        null, o
                    );
                    break;
                case "jump_to_node":
                    await dispatch(
                        "WindowManagerStore/openJumpToNodeWindow",
                        null, o
                    );
                    break;
                
                ///////////////////////////////////////////////////////////////
                //  3. Time  //////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////

                case "set_day_night_mode":
                    await dispatch(
                        "AppSettingsStore/setDayNightMode", 
                        data?.id, o
                    );
                    break;

                case "snap_to_day":
                    await dispatch(
                        "ActivitySetsStore/snapFocus", 
                        { time: "day", direction: "none" }, o
                    );
                    break;
                case "snap_to_night":
                    await dispatch(
                        "ActivitySetsStore/snapFocus", 
                        { time: "night", direction: "none" }, o
                    );
                    break;
                case "jump_to_prev_night":
                    await dispatch(
                        "ActivitySetsStore/snapFocus", 
                        { time: "night", direction: "backward" }, o
                    );
                    break;
                case "jump_to_prev_day":
                    await dispatch(
                        "ActivitySetsStore/snapFocus", 
                        { time: "day", direction: "backward" }, o
                    );
                    break;
                case "jump_to_next_day":
                    await dispatch(
                        "ActivitySetsStore/snapFocus", 
                        { time: "day", direction: "forward" }, o
                    );
                    break;
                case "jump_to_next_night":
                    await dispatch(
                        "ActivitySetsStore/snapFocus", 
                        { time: "night", direction: "forward" }, o
                    );
                    break;

                case "set_nudge_interval":
                    await dispatch(
                        "AppSettingsStore/setNudgeInterval",
                        data?.interval, o
                    );
                    break;

                case "nudge_time_focus_forward":
                    await dispatch(
                        "ActivitySetsStore/nudgeFocus",
                        "forward", o
                    );
                    break;
                case "nudge_time_focus_backward":
                    await dispatch(
                        "ActivitySetsStore/nudgeFocus",
                        "backward", o
                    );
                    break;
                
                case "expand_time_focus_beg":
                    await dispatch(
                        "ActivitySetsStore/nudgeFocusBeg",
                        "forward", o
                    );
                    break;
                case "contract_time_focus_beg":
                    await dispatch(
                        "ActivitySetsStore/nudgeFocusBeg",
                        "backward", o
                    );
                    break;
                case "expand_time_focus_end":
                    await dispatch(
                        "ActivitySetsStore/nudgeFocusEnd",
                        "forward", o
                    );
                    break;
                case "contract_time_focus_end":
                    await dispatch(
                        "ActivitySetsStore/nudgeFocusEnd",
                        "backward", o
                    );
                    break;

                ///////////////////////////////////////////////////////////////
                //  4. View  //////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////
                
                case "enable_low_quality_render":
                    await dispatch(
                        "AppSettingsStore/setGraphViewDisplaySetting", 
                        { id: "render_high_quality", value: false }, o
                    );
                    break;
                case "enable_high_quality_render":
                    await dispatch(
                        "AppSettingsStore/setGraphViewDisplaySetting", 
                        { id: "render_high_quality", value: true }, o
                    );
                    break;
                
                case "cluster_by":
                    await dispatch(
                        "AppSettingsStore/enableClusterFeature",
                        { feature: data.feature, enabled: !data.value }, o
                    );
                    break;
                
                case "display_cluster_info":
                case "display_analytic_nodes":
                case "display_lateral_movements":
                    await dispatch(
                        "AppSettingsStore/setGraphViewDisplaySetting", 
                        { id: id as GraphViewDisplaySetting, value: !data.value }, o
                    );
                    break;
                
                case "display_24_hour_time":
                    await dispatch(
                        "AppSettingsStore/setAppDisplaySetting", 
                        { id: id as AppDisplaySetting, value: !data.value }, o
                    );
                    break;
                
                case "show_timeline":
                    await dispatch(
                        "AppSettingsStore/showTimeline", 
                        !data.value, o
                    );
                    break;
        
                ///////////////////////////////////////////////////////////////
                //  5. Help  //////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////

                case "open_about_window":
                    await dispatch(
                        "WindowManagerStore/openAboutWindow", 
                        id as AppDisplaySetting, o
                    );
                    break;
        
                default:
                    break;

            }
        }

    }
} as Module<ContextMenuStore, ModuleStore>

/**
 * Recursively filters out disabled and empty menus from a ContextMenuItem.
 * @param menu
 *  The context menu item to filter.
 * @param features
 *  The features to enable / disable (specified by id).
 *  (Default: {})
 * @returns
 *  The filtered context menu item.
 */
function filterMenuOptions(
    menu: ContextMenuItem, features: { [key: string]: boolean } = {}
): ContextMenuItem | null {
    // Return null if menu disabled
    if (menu.id in features && !features[menu.id]) return null;
    // Return menu if no submenus
    if (menu.type !== "submenu") return menu;
    // Filter sections
    for (let i = menu.sections.length - 1; 0 <= i; i--) {
        let section: ContextMenuSection = menu.sections[i];
        if (section.id in features && !features[section.id]) {
            menu.sections.splice(i, 1);
        } else {
            // Filter section items
            for (let j = section.items.length - 1; 0 <= j; j--) {
                let item = section.items[j];
                if (item.id in features && !features[item.id]) {
                    section.items.splice(j, 1);
                } else if (item.type === "submenu") {
                    // Filter submenus
                    filterMenuOptions(item, features)
                    if (item.sections.length === 0) {
                        section.items.splice(j, 1);
                    }
                }
            }
            if (section.items.length === 0) {
                menu.sections.splice(i, 1);
            }
        }
    }
    // Return filtered menu
    return menu.sections.length === 0 ? null : menu;
}
