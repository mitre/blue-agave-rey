import Features from "@/assets/rey.features";
import { Download } from "@/assets/scripts/WebUtilities/Download";
import { ActivitySetPlainEdge } from "@/assets/scripts/ViewData/ViewEdge";
import { ActivitySetAnalyticNode, ActivitySetEventNode } from "@/assets/scripts/ViewData/ViewNode";
import type { Module } from "vuex";
import type { ActivitySetFile, LateralMovementFile } from "@/assets/scripts/ViewData/ActivitySetFileTypes";
import type { ModuleStore, ActivitySetImporter, ActivitySetClassification } from "@/store/StoreTypes"

const FetchSet         = "ActivitySetApi/fetchActivitySet";
const FetchLms         = "ActivitySetApi/fetchLateralMovements";
const ImportSet        = "ActivitySetsStore/importActivitySetFiles";
const ImportLms        = "ActivitySetsStore/importLateralMovementFile";
const ClassifySet      = "ActivitySetApi/classifyActivitySet";
const CloseWindow      = "WindowManagerStore/closeWindow";
const UpdateWindow     = "WindowManagerStore/updateImportStatusWindow";
const OpenStatusWindow = "WindowManagerStore/openImportStatusWindow";

export default {
    namespaced: true,
    actions: {

        /**
         * Imports an Activity Set file. 
         * @param ctx
         *  The Vuex context.
         * @param file
         *  The Activity Set file.
         * @throws { ActivitySetApiError }
         *  If the activity set could not be classified.
         * @throws { MalformedActivitySetError }
         *  If `file` is an improperly formatted Activity Set file.
         */
         async importActivitySetFile({ dispatch }, file: ActivitySetFile | string) {
            let { enable_activity_set_classification } = Features.classification;
            let { enable_activity_set_file_open } = Features.import_export
            let o = { root: true }

            // Ensure import by file is permitted
            if(!enable_activity_set_file_open)
                return;

            // Parse string to JSON if necessary
            if (file.constructor.name === String.name) {
                file = JSON.parse(file as string) as ActivitySetFile;
            }
           
            // Run classification
            let id: string | undefined;
            let err: Error | undefined;
            let score: ActivitySetClassification = {
                value: NaN,
                scored_by: "",
                description: ""
            };
            if(enable_activity_set_classification) {
                // Open import status window
                id = await dispatch(OpenStatusWindow, { 
                    title: "Analyzing Activity Set...",
                    subtitle: "0 of 1 Complete"
                }, o);
                // Classify Activity Set
                try { 
                    score = (await dispatch(ClassifySet, file, o));
                } catch(ex: any) {
                    err = ex;
                }   
            }
            
            // Import Activity Set
            try { 
                let files = [{ file, data: { score } }];
                await dispatch(ImportSet, { files }, o);
            } catch(ex: any) {
                err = ex;
            }
            
            // Close status window
            if(id) {
                await dispatch(CloseWindow, id, o);
            }
            
            // Throw exception if one occurred
            if(err) {
                throw err;
            }

        },

        /**
         * Imports Activity Sets by id.
         * @param ctx
         *  The Vuex context.
         * @param importParams
         *  [ids]
         *   An Activity Set id, or an array of Activity Set ids, to import.
         *  [refs]
         *   A node id, or an array of node ids, to focus on.
         *   `undefined` if none.
         *  [importLateralMoves]
         *   If true, missed lateral movements will be imported.
         * @throws { ActivitySetApiError }
         *  If an activity set could not be fetched.
         *  If an activity set could not be classified.
         *  If the lateral movements could not be fetched.
         * @throws { MalformedActivitySetError }
         *  If the API returns an improperly formatted Activity Set file.
         * @throws { MalformedLateralMovementError }
         *  If the API returns an improperly formatted Lateral Movement file.
         */
        async importActivitySetFileById({ dispatch }, { ids, refs, importLateralMoves }: ImportByIdParams) {
            let o = { root: true }
            let { 
                enable_activity_set_classification
            } = Features.classification;
            let { 
                enable_activity_set_import_by_id,
                enable_missed_lateral_movement_import
            } = Features.import_export

            // Ensure import by id is permitted
            if(!enable_activity_set_import_by_id)
                return;

            // Convert ids to an array if necessary
            if(!Array.isArray(ids)) ids = [ids];
            
            // Open import status window
            let id = await dispatch(OpenStatusWindow, { 
                title: "Downloading Activity Set...",
                subtitle: `0 of ${ ids.length } Complete`
            }, o);
            
            // Run import process
            let err: Error | undefined;
            try {

                // Compile import files
                let files = [];
                for(let id of ids) {
                    files.push(new Promise<any>(async (res, rej) => {
                        try {
                            let file  = await dispatch(FetchSet, id, o);
                            let score: ActivitySetClassification;
                            if(enable_activity_set_classification) {
                                score = await dispatch(ClassifySet, file, o);
                            } else {
                                score =  {
                                    value: NaN,
                                    scored_by: "",
                                    description: ""
                                };
                            }
                            res({ file, data: { score }});
                        } catch(ex) {
                            rej(ex);
                        }
                    }));
                }

                // Await compilation
                for(let i = 0; i < files.length; i++) {
                    await files[i];
                    await dispatch(UpdateWindow, {
                        id,
                        subtitle: `${ i + 1 } of ${ files.length } Complete`
                    }, o);
                }

                // Download lateral movements
                let lateralMoveFile: LateralMovementFile = { moves: [] };
                if(enable_missed_lateral_movement_import && importLateralMoves) {
                    lateralMoveFile = await dispatch(FetchLms, ids, o);
                }

                // Wait for next frame
                await new Promise(r => (requestAnimationFrame(r)));

                // Import activity sets and lateral movements
                let imports = [];
                for(let i = 0; i < files.length; i++) {
                    files[i] = await files[i]
                }
                imports.push(dispatch(ImportSet, { files, refs }, o));
                imports.push(dispatch(ImportLms, lateralMoveFile, o));

                // Await imports
                await dispatch(UpdateWindow, {
                    id,
                    title: "Importing Activity Sets..."
                }, o);
                await Promise.all(imports);
                
            } catch(ex: any) {
                err = ex;
            }
            
            // Close status window
            await dispatch(CloseWindow, id, o);
            
            // Throw exception if one occurred
            if(err) {
                throw err;
            }

        },

        /**
         * Exports the current session to a .json file.
         * @param ctx
         *  The Vuex context.
         */
        async exportSessionAsJson({ rootState }) {
            let { nodes : n, edges: e } = rootState.ActivitySetsStore;
            // Declare file
            let file = {
                activity_set_id: "export",
                analytic_results: [],
                events: [],
                edges: []
            } as ActivitySetFile
            // Populate nodes
            for(let node of n.values()) {
                if(node instanceof ActivitySetAnalyticNode) {
                    file.analytic_results!.push(node.data);
                } else if(node instanceof ActivitySetEventNode) {
                    file.events.push(node.data);
                }
            }
            // Populate edges
            for(let edge of e.values()) {
                if(edge instanceof ActivitySetPlainEdge) {
                    file.edges.push(edge.data);
                }
            }
            // Generate filename
            let d = new Date().toJSON().split(/[-T:.]/g);
            let date = `${ d[0] }${ d[1] }${ d[2] }`;
            let time = `${ d[3] }${ d[4] }${ d[5] }`;
            let filename = `activity_set_${ date }_${ time }`;
            // Export file
            Download.textFile(filename, JSON.stringify(file), "json");
        }
        
    }

} as Module<ActivitySetImporter, ModuleStore>


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


type ImportByIdParams = { 
    ids: string | string[], 
    refs: string | string[] | undefined,
    importLateralMoves: boolean
}
