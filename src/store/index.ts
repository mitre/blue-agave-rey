import { createStore } from 'vuex'
import { ModuleStore } from '@/store/StoreTypes'
import HotkeyStore from './Stores/HotkeyStore'
import ActivitySetApi from './Stores/ActivitySetApi'
import ContextMenuStore from './Stores/ContextMenuStore'
import AppSettingsStore from './Stores/AppSettingsStore'
import WindowManagerStore from './Stores/WindowManagerStore'
import ActivitySetImporter from './Stores/ActivitySetImporter'
import ActivitySetsStore, { SetsStoreIntegrations } from './Stores/ActivitySetsStore'
import ActivitySetNetworkStore, { NetworkStoreIntegrations } from './Stores/ActivitySetNetworkStore'
import ActivitySetTimelineStore, { TimelineStoreIntegrations } from './Stores/ActivitySetTimelineStore'

export default createStore<ModuleStore>({
    modules: {
        HotkeyStore,
        ActivitySetApi,
        ContextMenuStore,
        AppSettingsStore,
        ActivitySetsStore,
        WindowManagerStore,
        ActivitySetImporter,
        ActivitySetNetworkStore,
        ActivitySetTimelineStore,
    },
    plugins: [
        SetsStoreIntegrations,
        NetworkStoreIntegrations,
        TimelineStoreIntegrations
    ]
})
