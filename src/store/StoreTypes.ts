import { Timeframe } from "@/assets/scripts/Collections/Timeframe";
import { HotkeyObserver } from "@/assets/scripts/WebUtilities/HotkeyObserver";
import { GenericViewItem } from "@/assets/scripts/Visualizations/ViewBaseTypes/GenericViewItem";
import { ActivitySetInfo } from "@/assets/scripts/ViewData/ActivitySetInfo";
import { ObjectKeysOfType } from "@/assets/scripts/HelperTypes";
import { ActivitySetEvent } from "@/assets/scripts/ViewData/ActivitySetFileTypes";
import { ChronologicalIndex } from "@/assets/scripts/Collections/ChronologicalIndex";
import { ActivitySetCommonEdge } from "@/assets/scripts/ViewData/ViewEdge";
import { ActivitySetCommonNode } from "@/assets/scripts/ViewData/ViewNode";
import { ActivitySetTimelineLane } from "@/assets/scripts/ViewData/ViewTimelineLane";


///////////////////////////////////////////////////////////////////////////////
//  1. Stores  ////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export type ModuleStore = {
    HotkeyStore: HotkeyStore,
    ActivitySetApi: ActivitySetApi,
    ContextMenuStore: ContextMenuStore,
    AppSettingsStore: AppSettingsStore,
    ActivitySetsStore: ActivitySetsStore,
    WindowManagerStore: WindowManagerStore,
    ActivitySetImporter: ActivitySetImporter,
    ActivitySetNetworkStore: ActivitySetNetworkStore,
    ActivitySetTimelineStore: ActivitySetTimelineStore,
}

export type HotkeyStore = {
    observer: HotkeyObserver | null
}

export type ActivitySetApi = {}

export type ContextMenuStore = {}

export type AppSettingsStore = {
    settings: AppSettings,
    active_day_night_mode: {
        id: string,
        timeframe: Timeframe
    },
    active_nudge_interval: {
        id: string,
        time: number
    },
    active_timeline_breakout: {
        id: string,
        key: string,
        on: "event" | "analytic"
    },
    active_timeline_sort: {
        id: "time" | "name"
    }
}

export type ActivitySetsStore = {
    sets: Map<string, ActivitySetInfo>,
    nodes: Map<string, ActivitySetCommonNode>,
    edges: Map<string, ActivitySetCommonEdge>,
    focus: Timeframe,
    selected: Map<string, GenericViewItem>,
    collapsed: Map<string, GenericViewItem>,
    timeframe: Timeframe,
    timeIndex: ChronologicalIndex<ActivitySetCommonNode>,
    triggerDataLoaded: number,
    triggerDataFocused: number,
    triggerDataDisplay: number, 
    triggerDataSelected: number
    triggerNetworkLayout: number,
    triggerCameraFocus: number
}

export type WindowManagerStore = {
    windows: Array<{ id: string, component: any, title: string, data: any }>
    uniqueIdCounter: number;
}

export type ActivitySetImporter = {}

export type ActivitySetNetworkStore = {
    frozen: Set<string>
}

export type ActivitySetTimelineStore = {
    lanes: ActivitySetTimelineLane[],
    triggerTimelineLayout: number
}


///////////////////////////////////////////////////////////////////////////////
//  2. App Settings  //////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


/**
 * App Settings File
 */
export type AppSettings = {
    apis: {
        activity_set_import_api: string,
        activity_set_import_lm_api: string,
        activity_set_import_search_api: string,
        activity_set_import_filters_api: string,
        activity_set_classification_api: string,
        activity_set_group_matching_api: string,
    },
    view: {
        app: AppDisplaySettings,
        graph: GraphViewDisplaySettings,
        timeline: TimelineViewDisplaySettings,
    },
    time: {
        nudge_interval: string,
        day_night_mode: string,
    },
    keybindings: {
        import_export: ImportExportKeybindings,
        selection: SelectionKeybindings,
        time_focus: TimeFocusKeybindings,
        view: ViewKeybindings
    },
    file_classes: FileTypeClasses
}

/**
 * App Display Settings
 */
export type AppDisplaySettings = {
    display_24_hour_time: boolean,
    display_day_night_highlighting: boolean,
    appearance: AppearanceSettings
}

export type AppDisplaySetting = ObjectKeysOfType<AppDisplaySettings, boolean>;

/**
 * Graph Display Settings
 */
export type GraphViewDisplaySettings = {
    render_high_quality: boolean,
    display_lateral_movements: boolean,
    display_cluster_info: boolean,
    display_analytic_nodes: boolean,
    active_clustering_features: Array<keyof ActivitySetEvent>
}

export type GraphViewDisplaySetting = ObjectKeysOfType<GraphViewDisplaySettings, boolean>;

/**
 * Timeline Display Settings
 */
export type TimelineViewDisplaySettings = {
    breakout_feature: string | null,
    sort_feature: SortFeature,
    stack_car_types: boolean
}

export type SortFeature = "time" | "name";

export type TimelineViewDisplaySetting = ObjectKeysOfType<TimelineViewDisplaySettings, boolean>;

/**
 * Appearance Settings
 */
export type AppearanceSettings = {
    timeline: boolean
}

export type AppearanceSetting = ObjectKeysOfType<AppearanceSettings, boolean>;

/**
 * Import & Export Keybindings
 */
export type ImportExportKeybindings = {
    open_activity_set: string,
    add_activity_set: string,
    add_lateral_movement: string,
    import_activity_sets: string,
    import_activity_set_by_id: string,
    export_session: string
}

/**
 * Selection Keybindings
 */
export type SelectionKeybindings = {
    traceback: string,
    multi_select: string,
    select_all: string,
    deselect_all: string,
    freeze_node: string,
    collapse_node: string,
    zoom_to_selection: string,
    jump_to_parent: string,
    jump_to_children: string,
    jump_to_node: string
} 

/**
 * Time Focus Keybindings
 */
export type TimeFocusKeybindings = {
    snap_to_day: string,
    snap_to_night: string,
    jump_to_prev_night: string,
    jump_to_prev_day: string,
    jump_to_next_day: string,
    jump_to_next_night: string,
    nudge_time_focus_forward: string,
    nudge_time_focus_backward: string,
    expand_time_focus_beg: string,
    expand_time_focus_end: string,
    contract_time_focus_beg: string,
    contract_time_focus_end: string
}

/**
 * View Keybindings
 */
export type ViewKeybindings = {
    display_lateral_movements: string,
    display_cluster_info: string,
    display_analytic_nodes: string,
    display_24_hour_time: string
}

/**
 * File Type Classes
 */
export type FileTypeClasses = {
    text: Set<string>,
    image: Set<string>,
    audio: Set<string>,
    video: Set<string>,
    archive: Set<string>,
    executable: Set<string>,
    spreadsheet: Set<string>
}


///////////////////////////////////////////////////////////////////////////////
//  3. Context Menu Settings  /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


type ContextMenuItemType = "submenu" | "action" | "file" | "link" | "toggle"

interface ContextMenuBase<T extends ContextMenuItemType> {
    id   : string,
    text : string,
    type : T,
    disabled?: boolean,
    data?: any
}

interface ContextMenuSubMenu extends ContextMenuBase<"submenu"> {
    sections : ContextMenuSection[]
}

interface ContextMenuAction extends ContextMenuBase<"action"> {
    shortcut?: string
}

interface ContextMenuFileAction extends ContextMenuBase<"file"> {
    shortcut?: string
}

interface ContextMenuLinkAction extends ContextMenuBase<"link"> {
    link: string
}

interface ContextMenuToggleAction extends ContextMenuBase<"toggle"> {
    shortcut?: string
    value: boolean
}

export interface ContextMenuSection {
    id: string,
    items: ContextMenuItem[]
}

export type ContextMenuItem = ContextMenuSubMenu 
    | ContextMenuAction 
    | ContextMenuFileAction 
    | ContextMenuLinkAction 
    | ContextMenuToggleAction;


///////////////////////////////////////////////////////////////////////////////
//  4. Hotkey Settings  ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


type HotkeyItemType = "action" | "file" | "link" | "toggle"

interface HotkeyRepeatOptions {
    delay: number,
    interval: number
}

export interface HotkeyItemBase<T extends HotkeyItemType> {
    id: string,
    type: T;
    shortcut: string,
    disabled?: boolean,
    allowBrowserBehavior?: boolean
}

export interface HotkeyAction extends HotkeyItemBase<"action"> {
    repeat?: HotkeyRepeatOptions
}

interface HotkeyLinkAction extends HotkeyItemBase<"link"> {
    link: string
}

interface HotkeyToggleAction extends HotkeyItemBase<"toggle"> {
    value: boolean
}

export type HotkeyItem = HotkeyAction 
    | HotkeyItemBase<"file"> 
    | HotkeyLinkAction 
    | HotkeyToggleAction;


///////////////////////////////////////////////////////////////////////////////
//  5. API Types  /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export type SetImportFilters = {
    hosts      : string[],
    users      : string[],
    tactics    : string[],
    techniques : string[],
    time_range : {
        min: Date,
        max: Date
    }
}

export type ActivitySetClassification = {
    description: string,
    scored_by: string,
    value: number
}

export type MitreAttackGroup = {
    attack_link: string,
    description: string,
    group_id: string,
    name: string,
    rank: number,
    score: number
}

export type MatchedMitreAttackGroups = {
    activity_sets: string[],
    matching_groups: MitreAttackGroup[]
}
