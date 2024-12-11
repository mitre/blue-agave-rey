<template>
  <div class="activity-set-search-panel" @contextmenu.stop>
    <SearchField id="search-field" :fields="fields" @search="onSearch"></SearchField>
    {{ results }}
  </div>
</template>

<script lang="ts">
import Features from "@/assets/rey.features";
import * as Store from "@/store/StoreTypes";
// Dependencies
import { mapState } from "vuex";
import { defineComponent, type PropType } from "vue";
import type { Index } from "lunr";
// Components
import SearchField from "@/components/Controls/SearchField.vue";

export default defineComponent({
  name: "Search",
  data() {
    return {
      fields: new Set(Features.activity_set_event_listing.indexed_keys),
      results: [] as Index.Result[]
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
     * Performs a search.
     * @param queryString
     *  The query string. 
     */
    onSearch(queryString: string) {
      try {
        this.results = this.searchIndex.search(queryString);
        console.log(this.results);
      } catch(err) {
        console.log("Search Failed.");
        console.log(err);
      }
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

</style>
