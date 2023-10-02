import { ActivitySetClassification } from "@/store/StoreTypes"

/**
 * Activity Set File definition.
 */
export type ActivitySetFile = {
    activity_set_id: string,
    analytic_results?: ActivitySetAnalytic[],
    alerts?: ActivitySetAnalytic[],
    edges: ActivitySetEdge[],
    events: ActivitySetEvent[]
}

/**
 * Lateral Movement File definition.
 */
export type LateralMovementFile = {
    moves: ActivitySetEdge[]
}

/**
 * Activity Set Analytic definition.
 */
export type ActivitySetAnalytic = {
    alert_id: string,
    analytic_id: string,
    analytic_name: string,
    analytic_result_id: string,
    attack_tactic: string,
    attack_technique_id: string,
    key_event: string
}

/**
 * Activity Set Edge definition.
 */
export type ActivitySetEdge = {
    bam_created_date: Date,
    dest_event: string,
    edge_id: string,
    reported_by: string,
    source: string,
    src_event: string
}

/**
 * Activity Set Event definition.
 */
export type ActivitySetEvent = {
    action: string,
    call_trace?: string,
    command_line: string,
    content?: ActivitySetArchive,
    dest_ip?: string,
    dest_port?: number,
    event_id: string,
    event_type_id?: number,
    event_xml: string,
    exe: string,
    file_name?: string,
    fqdn: string,
    host: string,
    image_path: string,
    integrity_level: string,
    investigations: string[],
    log_name: string,
    logon_id: string,
    module_name?: string,
    object: string,
    parent_command_line: string,
    parent_exe: string,
    parent_image_path: string,
    parent_process_guid: string,
    pid: number,
    ppid: number,
    process_guid: string,
    record_number: number,
    sysmon_event_time: Date,
    time: Date,
    user: string,
    uuid: string,
    value?: string
    /**
     * Developer's Note:
     * `car_attributes` does not come from the original file spec, this field
     * is set by Rey on import. It contains the event's full CAR type and 
     * allows events to be broken out by CAR type in the timeline. 
     */
     car_attributes: string,
}

/**
 * Activity Set Archive definition.
 */
export type ActivitySetArchive = {
    type: "archive-info",
    data: {
        entries: ActivitySetArchiveFile[],
        injected: ActivitySetArchiveFileInjection[],
        removed: ActivitySetArchiveFile[]
    }
}

/**
 * Activity Set Archive File definition.
 */
export type ActivitySetArchiveFile = {
    file_path: string,
    SHA256: string
}

/**
 * Activity Set Archive File Injection definition.
 */
export type ActivitySetArchiveFileInjection = {
    file_path: string,
    injection_path: string
}

/**
 * Activity Set API data definition.
 */
export type ActivitySetApiData = {
    score: ActivitySetClassification
}
