import axios from "axios";
import { ActivitySetApiError } from "../Exceptions/ActivitySetApiError";
import type { Module } from "vuex";
import type { 
    ActivitySetFile,
    LateralMovementFile
} from "@/assets/scripts/ViewData/ActivitySetFileTypes";
import type {
    ModuleStore,
    ActivitySetApi,
    SetImportFilters,
    ActivitySetClassification,
    MatchedMitreAttackGroups
} from "@/store/StoreTypes"

export default {
    namespaced: true,
    actions: {

        /**
         * Classifies an Activity Set file.
         * @param ctx
         *  The Vuex context.
         * @param file
         *  The activity set file to classify.
         * @returns
         *  A Promise that resolves with the activity set classification.
         * @throws { ActivitySetApiError }
         *  If the activity set could not be classified.
         */
        async classifyActivitySet({ rootState }, file: ActivitySetFile): Promise<ActivitySetClassification> {
            let { apis } = rootState.AppSettingsStore.settings;
            let { 
                activity_set_import_api,
                activity_set_classification_api
            } = apis;
            try {
                // Send Activity Set
                await axios.post(activity_set_import_api, file)
                // Format Activity Set
                let analytics = (file.analytic_results ?? file.alerts)!;
                let as = { 
                    activity_set_id: [file.activity_set_id],
                    edges: file.edges.map(o => o.edge_id),
                    events: file.events.map(o => o.event_id),
                    analytic_results: analytics.map(o => o.analytic_result_id),
                }
                // Classify Activity Set
                let { data } = await axios.post(
                    activity_set_classification_api, 
                    { as }
                );
                return data[0];
            } catch(ex: any) {
                throw new ActivitySetApiError(
                    "Activity Set Classification Failed",
                    `The activity set could not be classified: ${ ex.message }`,
                    ex
                );
            }
        },

        /**
         * Matches activity to a set of ATT&CK groups.
         * @param ctx
         *  The Vuex context.
         * @param files
         *  The activity sets that encapsulate the activity.
         * @returns
         *  A Promise that resolves with the matched ATT&CK groups.
         * @throws { ActivitySetApiError }
         *  If the activity could not be matched.
         */
        async matchActivitySets({ rootState }, files: ActivitySetFile[]): Promise<MatchedMitreAttackGroups> {
            let { apis } = rootState.AppSettingsStore.settings;
            let {
                activity_set_group_matching_api
            } = apis;
            try {
                // Match activity sets
                let { data } = await axios.post<MatchedMitreAttackGroups>(
                    activity_set_group_matching_api,
                    { activity_sets: files }
                );
                // Return results
                return data;
            } catch(ex: any) {
                throw new ActivitySetApiError(
                    "Group Matching Failed",
                    `The activity could not be matched: ${ ex.message }`,
                    ex
                );
            }
        },

        /**
         * Fetches the Activity Set import filters.
         * @param ctx
         *  The Vuex context.
         * @returns
         *  A Promise that resolves with the activity set import filters.
         * @throws { ActivitySetApiError }
         *  If the activity set import filters could not be fetched.
         */
        async fetchImportFilters({ rootState }): Promise<SetImportFilters> {
            let { apis } = rootState.AppSettingsStore.settings;
            let { activity_set_import_filters_api } = apis;
            try {
                let filters = (await axios.get(activity_set_import_filters_api)).data;
                filters.time_range.min = new Date(filters.time_range.min);
                filters.time_range.max = new Date(filters.time_range.max);
                return filters;
            } catch(ex: any) {
                throw new ActivitySetApiError(
                    "Activity Set Import Filters Not Available",
                    `The activity set import filters could not be downloaded: ${ ex.message }`,
                    ex
                );
            }
        },

        /**
         * Searches for Activity Sets that match the search parameters.
         * @param ctx
         *  The Vuex context.
         * @param search
         *  The search parameters.
         * @returns
         *  A Promise that resolves with the list of activity set ids that
         *  match the search parameters.
         * @throws { ActivitySetApiError }
         *  If the search failed to run.
         */
        async searchActivitySets({ rootState }, search: SetImportFilters): Promise<string[]> {
            let { apis } = rootState.AppSettingsStore.settings;
            let { activity_set_import_search_api } = apis;
            try {
                return (await axios.post(activity_set_import_search_api, search)).data;
            } catch(ex: any) {
                throw new ActivitySetApiError(
                    "Activity Set Search Failed",
                    `The activity set search could not be run: ${ ex.message }`,
                    ex
                );
            } 
        },

        /**
         * Fetches an Activity Set file.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the Activity Set.
         * @returns
         *  A Promise that resolves with the Activity Set file.
         * @throws { ActivitySetApiError }
         *  If the activity set could not be fetched.
         */
        async fetchActivitySet({ rootState }, id: string): Promise<ActivitySetFile> {
            let { apis } = rootState.AppSettingsStore.settings;
            let { activity_set_import_api } = apis;
            try {
                return (await axios.get(`${ activity_set_import_api }/${ id }`)).data;
            } catch(ex: any) {
                throw new ActivitySetApiError(
                    "Activity Set Download Failed",
                    `The activity set could not be downloaded: ${ ex.message }`,
                    ex
                );
            }
        },

        /**
         * Fetches all lateral movements that connect a set of activity sets.
         * @param ctx
         *  The Vuex context.
         * @param ids
         *  The ids of the Activity Sets.
         * @returns
         *  A Promise that resolves with all lateral movements that connect the
         *  activity sets.
         * @throws { ActivitySetApiError }
         *  If the lateral movements could not be fetched.
         */
        async fetchLateralMovements({ rootState }, ids: string[]): Promise<LateralMovementFile> {
            let { apis } = rootState.AppSettingsStore.settings;
            let { activity_set_import_lm_api } = apis;
            try {
                return (await axios.post(activity_set_import_lm_api, { activity_sets: ids })).data;
            } catch(ex: any) {
                throw new ActivitySetApiError(
                    "Lateral Movements Download Failed",
                    `Lateral movements could not be downloaded: ${ ex.message }`,
                    ex
                );
            }
        }

    }

} as Module<ActivitySetApi, ModuleStore>
