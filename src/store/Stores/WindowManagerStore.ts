// Dependencies
import { markRaw } from "@vue/reactivity";
import { DetailedError } from "@/assets/scripts/DetailedError";
import type { Module } from "vuex";
import type { ModuleStore, WindowManagerStore } from "@/store/StoreTypes";
// Components
import AboutWindow from "@/components/Windows/AboutWindow.vue";
import ExceptionWindow from "@/components/Windows/ExceptionWindow.vue";
import SetImportWindow from "@/components/Windows/SetImportWindow.vue";
import JumpToNodeWindow from "@/components/Windows/JumpToNodeWindow.vue";
import SetImportByIdWindow from "@/components/Windows/SetImportByIdWindow.vue";
import LoadingStatusWindow from "@/components/Windows/LoadingStatusWindow.vue";

// TODO: Consider moving the window store into a top-level component. Provide
//       window control functions to children via `provide()` and `inject()`.

export default {
    namespaced: true,
    state: {
        windows: [],
        uniqueIdCounter: 0
    },

    actions: {

        /**
         * Opens the About Window.
         * @param ctx
         *  The Vuex context.
         */
        openAboutWindow({ commit }) {
            commit("openWindow", {
                id: "about",
                component: AboutWindow,
                title: "About",
                data: {}
            });
        },

        /**
         * Opens an Exception Window.
         * @param ctx
         *  The Vuex context. 
         * @param exceptionParameters
         *  [ex]
         *   The exception information.
         *  [src]
         *   The source of the exception.
         */
        openExceptionWindow({ commit, state }, { ex, src }: { ex: any, src: string }) {
            // Format exception
            let exception: DetailedError;
            if (ex instanceof DetailedError) {
                exception = ex;
            } else if (ex instanceof Error) {
                exception = new DetailedError(
                    "Rey Encountered a General Exception",
                    ex.message
                );
            } else {
                exception = new DetailedError(
                    "Rey Encountered a General Exception",
                    "Rey encountered an exception while attempting " + 
                    "to complete an unspecified operation.",
                    { data: ex }
                );
            }
            // Attach metadata
            exception.etc.type = ex.constructor.name;
            exception.etc.source = src;
            exception.etc.stack = ex.stack;
            exception.etc.message = ex.message;
            // Log exception
            console.error(ex);
            // Open exception window
            let id = `exception_window_${ state.uniqueIdCounter++ }`;
            commit("openWindow", {
                id,
                component: ExceptionWindow,
                title: "Rey Exception",
                data: { exception }
            });
        },

        /**
         * Opens an Import Status Window.
         * @param ctx
         *  The Vuex context.
         * @param loadParams
         *  [title]
         *   The import window's title.
         *  [subtitle]
         *   The import window's subtitle.
         * @returns
         *  The import status window's id.
         */
        openImportStatusWindow({ commit, state }, { title, subtitle }): string {
            let id = `loading_window_${ state.uniqueIdCounter++ }`;
            commit("openWindow", {
                id,
                component: LoadingStatusWindow,
                title: "Import",
                data: { title, subtitle }
            })
            return id;
        },

        /**
         * Updates an Import Status Window.
         * @param ctx
         *  The Vuex context.
         * @param updateParams
         *  [id]
         *   The id of the Import Status Window.
         *  [title]
         *   The import window's new title.
         *   (Default: original title)
         *  [subtitle]
         *   The import window's new subtitle.
         *   (Default: original subtitle)
         */
        updateImportStatusWindow({ commit }, { id, title, subtitle }) {
            commit("updateWindowData", {
                id, data: { title, subtitle }
            });
        },

        /**
         * Opens the Activity Sets Import Window.
         * @param ctx
         *  The Vuex context.
         */
        openSetImportWindow({ commit }) {
            commit("openWindow", {
                id: "import_activity_sets_window",
                component: SetImportWindow,
                title: "Import Activity Sets...",
                data: {}
            });
        },

        /**
         * Opens the Activity Set Import By ID Window.
         * @param ctx
         *  The Vuex context.
         */
        openSetImportByIdWindow({ commit }) {
            commit("openWindow", {
                id: "import_activity_set_by_id_window",
                component: SetImportByIdWindow,
                title: "Import Activity Set by ID...",
                data: {}
            });
        },

        /**
         * Opens the Jump To Node Window.
         * @param ctx
         *  The Vuex context.
         */
        openJumpToNodeWindow({ commit }) {
            commit("openWindow", {
                id: "jump_to_node_window",
                component: JumpToNodeWindow,
                title: "Jump to Node...",
                data: {}
            });
        },

        /**
         * Moves the specified window to the top of the window stack.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the window.
         */
        bringWindowToFront({ commit }, id: string) {
            commit("bringWindowToFront", id);
        },

        /**
         * Closes a window.
         * @param ctx
         *  The Vuex context.
         * @param id
         *  The id of the window.
         */
        closeWindow({ commit }, id: string) {
            commit("closeWindow", id);
        }

    },

    mutations: {

        /**
         * Adds a component to the set of open windows.
         * @param state
         *  The Vuex state.
         * @param window
         *  [id]
         *   The window's id.
         *  [component]
         *   The window component.
         *  [data]
         *   The window's auxillary data.
         * @returns 
         */
        openWindow(state, { id, component, title, data }: WindowParams) {
            if(state.windows.findIndex(o => o.id === id) !== -1)
                return;
            // markRaw() component to prevent it from becoming reactive.
            state.windows.push({ id, component: markRaw(component), title, data });
        },

        /**
         * Updates the data associated with a window.
         * @param state
         *  The Vuex state.
         * @param updateParams
         *  [id]
         *   The id of the window to update
         *  [data]
         *   The window's new auxillary data.
         */
        updateWindowData(state, { id, data }: { id: string, data: any }) {
            let window = state.windows.find(o => o.id === id);
            if(window) {
                // Remove undefined keys
                for(let id in data) {
                    if(data[id] === undefined)
                        delete data[id];
                }
                // Update window data
                window.data = { ...window.data, ...data };
            }
        },

        /**
         * Moves the specified window to the top of the window stack.
         * @param state
         *  The Vuex state.
         * @param id
         *  The id of the window.
         */
        bringWindowToFront(state, id: string) {
            let index = state.windows.findIndex(o => o.id === id);
            if(index !== -1) {
                let window = state.windows.splice(index, 1)[0];
                state.windows.push(window);
            }
        },

        /**
         * Removes a window from the set of open windows.
         * @param state
         *  The Vuex state.
         * @param id
         *  The id of the window.
         */
        closeWindow(state, id: string) {
            let index = state.windows.findIndex(o => o.id === id);
            if(index !== -1) state.windows.splice(index, 1);
        }

    }
} as Module<WindowManagerStore, ModuleStore>


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


type WindowParams =  { 
    id: string,
    component: any,
    title: string,
    data: any
}
