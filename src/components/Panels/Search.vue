<template>
  <div class="activity-set-search-panel" @contextmenu.stop>
    <SearchField id="search-field" :fields="fields" @search="onSearch">
      <span class="search-instrumentation" v-if="results.length">
        {{ result + 1 }} / {{ results.length }}
      </span>
    </SearchField>
    <div v-for="r of results" :key="r.ref" @click="moveCameraTo(r.ref)">
      {{ r }}
    </div>
  </div>
</template>

<script lang="ts">
import Features from "@/assets/rey.features";
import * as Store from "@/store/StoreTypes";
// Dependencies
import { defineComponent } from "vue";
import { mapActions, mapState } from "vuex";
import type { Index } from "lunr";
// Components
import SearchField from "@/components/Controls/SearchField.vue";

export default defineComponent({
  name: "Search",
  data() {
    return {
      fields: new Set(Features.activity_set_event_listing.indexed_keys),
      result: -1,
      results: [] as Index.Result[],
      queryString: ""
    }
  },
  computed: {

    /**
     * Activity Sets Store data
     */
     ...mapState<any, {
      searchIndex: (state: Store.ActivitySetsStore) => Index,
    }>("ActivitySetsStore", {
      searchIndex(state: Store.ActivitySetsStore): Index {
        return state.searchIndex;
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
      try {
        if(queryString !== this.queryString) {
          this.queryString = queryString;
          this.results = this.searchIndex.search(queryString);
          this.result = this.results.length ? 0 : -1;
        } else {
          this.result = (this.result + 1) % this.results.length;
        }
        if(this.result !== -1) {
          this.moveCameraTo(this.results[this.result].ref);
        }
        console.log(this.results);
      } catch(err) {
        console.log("Search Failed.");
        console.log(err);
      }
    },

    /**
     * Moves camera to a node.
     * @param id
     *  The node's id.
     */
    async moveCameraTo(id: string) {
      // Select items
      await this.unselectAll();
      await this.selectItem(id);
      // Trigger camera
      await this.triggerCameraFocus();
    }

  },
  components: { SearchField }
});
</script>

<style scoped>

/** === Main Panel === */

.activity-set-search-panel {
  padding: 15px 12px;
}

.search-instrumentation {
  margin-right: 10px;
}

</style>
