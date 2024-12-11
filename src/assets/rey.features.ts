import ProductAttribution from "@/components/Panels/ProductAttribution.vue";

const config = {
    links: {
        documentation_url: "https://gitlab.mitre.org/BB-ATE/rey",
        changelog_url: "https://gitlab.mitre.org/BB-ATE/rey/-/blob/master/CHANGELOG.md"
    },
    selection: {
        context_menu_links: []
    },
    time: {
        minimum_focus_width: 1000,
        day_night_modes: [
            { 
                id: "standard",
                text: "Standard",
                day_beg: "08:00:00",
                day_end: "20:00:00"
            },
            {
                id: "workday",
                text: "Workday",
                day_beg: "09:00:00",
                day_end: "17:00:00"
            }
        ],
        nudge_intervals: [
            { id: "day", text:"Day", time: 8.64e+7 },
            { id: "hour", text:"Hour", time: 3.6e+6 },
            { id: "minute", text:"Minute", time: 60000 },
            { id: "second", text:"Second", time: 1000 },
            { id: "event", text: "Event", time: 0 }
        ]
    },
    import_export: {
        enable_activity_set_file_open: true,
        enable_lateral_movement_file_open: true,
        enable_missed_lateral_movement_import: false,
        enable_activity_set_import_window: false,
        enable_activity_set_import_by_id: false,
        enable_activity_set_export: true
    },
    classification: {
        enable_activity_set_classification: false
    },
    group_matching: {
        enable_activity_set_group_matching: false
    },
    activity_set_graph: {
        clustering_features: ["host", "user"],
        event_edge_length: 100,
        analytic_edge_length: 100
    },
    activity_set_timeline: {
        breakout_features: [
            { 
                id: "attack_tactic", 
                key: "attack_tactic", 
                on: "analytic"
            },
            { 
                id: "host",
                key: "host",
                on: "event"
            },
            {
                id: "user",
                key: "user",
                on: "event"
            },
            {
                id: "event_type_id",
                key: "event_type_id",
                on: "event"
            },
            { 
                id: "car_attributes", 
                key: "car_attributes", 
                on: "event" 
            },
        ],
        no_analytic_lane_name: "None"
    },
    activity_set_event_listing: {
        excluded_keys: [
            "id",
            "uuid",
            "event_xml",
            "timestamp",
            "car_attributes"
        ],
        code_types: [
            "event_id",
            "logon_id",
            "file_path",
            "key_event",
            "call_trace",
            "command_line",
            "decoded_command_line",
            "parent_command_line",
            "image_path",
            "parent_image_path"
        ],
        indexed_keys: [
            "action",
            "call_trace",
            "command_line",
            "count",
            "event_type_id",
            "exe",
            "fqdn",
            "host",
            "image_path",
            "integrity_level",
            "investigations",
            "log_name",
            "logon_id",
            "object",
            "parent_command_line",
            "parent_exe",
            "parent_image_path",
            "parent_process_guid",
            "pid",
            "ppid",
            "process_guid",
            "record_number",
            "src_exe",
            "src_process_guid",
            "sysmon_event_time",
            "time",
            "user",
            // TODO: add more
        ]
    },
    activity_set_listing: {
        activity_set_id_length: 8
    },
    application: {
        product_attribution: ProductAttribution,
    }
}

export default config;