<template>
  <div class="activity-set-search-panel" @contextmenu.stop>
    <SearchField :fields="fields" @search="onSearch" ref="search">
      <span class="search-instrumentation" v-if="results.length">
        {{ result + 1 }} / {{ results.length }}
      </span>
    </SearchField>
    <div class="scrollbox" ref="element">
      <div class="content" ref="content">
        <SearchResult 
          v-for="(r, i) of results"
          :key="r.ref"
          :node="nodes.get(r.ref)!"
          :match="r"
          :class="{ active: i === result }"
          @click="select(i)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// TODO: Index doesn't update when file changes

import Features from "@/assets/rey.features";
import * as Store from "@/store/StoreTypes";
// Dependencies
import { RawScrollBox } from "@/assets/scripts/WebUtilities";
import { mapActions, mapState } from "vuex";
import { defineComponent, markRaw, ref } from "vue";
import type { Index } from "lunr";
import type { ActivitySetCommonNode } from "@/assets/scripts/ViewData/ViewNode";
// Components
import SearchField from "@/components/Controls/SearchField.vue";
import SearchResult from "@/components//Panels/SearchResult.vue";

export default defineComponent({
  name: "Search",
  setup() {
    return {
      search: ref(null),
      element: ref(null),
      content: ref(null)
    }
  },
  data() {
    return {
      fields: new Set(Features.activity_set_event_listing.indexed_keys),
      result: -1,
      results: [] as Index.Result[],
      queryString: "",
      scrollBox: markRaw(new RawScrollBox()),
    }
  },
  computed: {

    /**
     * Activity Sets Store data
     */
     ...mapState<any, {
      nodes: (state: Store.ActivitySetsStore) => Map<string, ActivitySetCommonNode>,
      searchIndex: (state: Store.ActivitySetsStore) => Index,
      triggerDataLoaded: (state: Store.ActivitySetsStore) => number
    }>("ActivitySetsStore", {
      nodes(state: Store.ActivitySetsStore): Map<string, ActivitySetCommonNode> {
        return state.nodes;
      },
      searchIndex(state: Store.ActivitySetsStore): Index {
        return state.searchIndex;
      },
      triggerDataLoaded(state: Store.ActivitySetsStore): number {
        return state.triggerDataLoaded;
      }
    }),

  },
  methods: {

    /**
     * Activity Sets Store actions
     */
    ...mapActions("ActivitySetsStore", [
      "unselectAll",
      "selectItem",
      "triggerCameraFocus"
    ]),

    /**
     * Performs a search.
     * @param queryString
     *  The query string. 
     */
    onSearch(queryString: string) {
      if(queryString !== this.queryString) {
        this.queryString = queryString;
        this.results = this.searchIndex.search(queryString);
        this.select(this.results.length ? 0 : -1);
      } else {
        this.select((this.result + 1) % this.results.length);
      }
    },

    /**
     * Selects a search result.
     * @param idx
     *  The search result's index.
     */
    async select(idx: number) {
      // Set index
      this.result = idx;
      if(!this.results.length || this.result === -1) {
        return;
      }
      // Get result
      const id = this.results[idx].ref;
      // Select result
      await this.unselectAll();
      await this.selectItem(id);
      // Trigger camera
      await this.triggerCameraFocus();
    }

  },
  watch: {
    // Reset search on data loaded
    triggerDataLoaded() {
      this.result = -1;
      this.results = [];
      this.queryString = "";
    }
  },
  mounted() {
    // Mount scroll box
    this.scrollBox.mount(
      this.element! as HTMLElement,
      this.content! as HTMLElement,
      this.$options.__scopeId
    )
  },
  beforeUnmount() {
    // Destroy scroll construct
    this.scrollBox.destroy();
  },
  components: { SearchField, SearchResult }
});

type Snippets = Map<string, string[]>
</script>

<style scoped>

/** === Main Panel === */

.activity-set-search-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%
}

/** === Search Field === */

.search-field-control {
  margin: 15px 12px;
  z-index: 1;
}

.search-instrumentation {
  margin-right: 10px;
}

/** === Search Results === */

.content {
  padding: 0px 12px 15px;
}

.search-result-panel {
  margin-bottom: 18px;
}

.search-result-panel:last-child {
  margin-bottom: 0px;
}

.search-result-panel.active {
  border-color: #909fff;
}

</style>
