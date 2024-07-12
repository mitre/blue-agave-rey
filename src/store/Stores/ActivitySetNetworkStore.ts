import type { Module, Store } from "vuex"
import type { ModuleStore, ActivitySetNetworkStore } from "@/store/StoreTypes";

export default {
    namespaced: true,
    state: {
        frozen: new Set()
    },
    
    actions: {

        ///////////////////////////////////////////////////////////////////////
        //  1. Altering Freeze  ///////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////


        /**
         * Adds / Removes a node from the frozen node set.
         * @param ctx
         *  The Vuex context.
         * @param frozenParams
         *  [id]
         *   The id of the node to freeze / unfreeze.
         *  [value]
         *   The freeze state. (true = frozen, false = unfrozen)
         */
        setNodeFreeze({ commit, rootState }, { id, value } : NodeFreezeStateParams) {
            if(rootState.ActivitySetsStore.nodes.has(id)) {
                commit("setNodeFreezeState", { id, value })
            }
        }

    },

    mutations: {

        /**
         * Adds / Removes a node from the frozen node set.
         * @param state
         *  The Vuex state.
         * @param frozenParams
         *  [id]
         *   The id of the node to freeze / unfreeze.
         *  [value]
         *   The freeze state. (true = frozen, false = unfrozen)
         */
        setNodeFreezeState(state, { id, value }: NodeFreezeStateParams) {
            if(value) {
                state.frozen.add(id);
            } else {
                state.frozen.delete(id);
            }
        },

        /**
         * Completely empties the store of all Activity Set data.
         * @param state
         *  The Vuex state.
         */
        dumpSession(state) {
            state.frozen = new Set();
        }

    }
} as Module<ActivitySetNetworkStore, ModuleStore>


///////////////////////////////////////////////////////////////////////////////
//  Store Integrations  ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export const NetworkStoreIntegrations = (store: Store<ModuleStore>) => {
    store.subscribe(mutation => {
        switch(mutation.type) {
            // On session dump
            case "ActivitySetsStore/dumpSession":
                store.commit(
                    "ActivitySetNetworkStore/dumpSession", 
                    null, { root: true }
                );
                break;
        }
    })
}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


type NodeFreezeStateParams = { 
    id: string, 
    value: boolean 
}
