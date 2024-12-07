<template>
  <Window 
    class="set-import-window" 
    title="Import Activity Sets..."
    @close="onClose"
    @grab="onGrab"
  >
    <div class="import-window">
      <!-- Filters Section -->
      <div class="filters-section">
        <!-- Timeframe Filter -->
        <div class="timeframe-select">
          <div class="datetime">
            <p>From</p>
            <DateTimePicker
              :value="filters.timeframe.beg" 
              :min="filters.timeRange.beg" 
              :max="filters.timeRange.end"
              @change="updateTimeframeBeg" 
            />
          </div>
          <div class="span-mark"></div>
          <div class="datetime">
            <p>To</p>
            <DateTimePicker
              :value="filters.timeframe.end"
              :min="filters.timeframe.beg"
              :max="filters.timeRange.end"
              @change="updateTimeframeEnd" 
            />
          </div>
        </div>
        <!-- Option Filters -->
        <div class="options-select">
          <div :class="['filter', key]" v-for="(option, key) in options" :key="key">
            <p class="section-title">{{ titleCase(key) }}</p> 
            <input 
              type="text"
              placeholder="Search"
              class="search-filter-input"
              v-model="searchFilter[key]"
            />
            <ScrollBox
              class="scrollbox"
              :resetScrollOnChange="false"
              :alwaysShowScrollBar="true"
            >
              <ul>
                <template v-if="loadingFilters">
                  <ChecklistLoader :elements="loaders[key]"/>
                </template>
                <template v-else-if="option.length === 0">
                  <p class="no-listing">No Filters</p>
                </template>
                <template v-else v-for="o in option" :key="o.text">
                  <li :class="{ active: o.value }" @click="toggleOption(o)">
                    <div class="checkbox"></div>
                    <p class="label">{{ o.text }}</p>
                  </li>
                </template>
              </ul>
            </ScrollBox>
          </div>
        </div>
      </div>
      <!-- Results Section -->
      <div class="results-section">
        <p class="section-title">Activity Sets</p>
        <input
          type="text"
          placeholder="Search"
          class="search-filter-input"
          v-model="searchFilter['sets']"
        />
        <ScrollBox
          class="scrollbox"
          :resetScrollOnChange="false"
          :alwaysShowScrollBar="true"
        >
          <ul>
            <template v-if="loadingResults">
              <ChecklistLoader :elements="loaders['sets']"/>
            </template>
            <template v-else-if="sets.length === 0">
              <p class="no-listing">No Results</p>
            </template>
            <template v-else v-for="o in sets" :key="o.text">
              <li :class="{ active: o.value }" @click="toggleResult(o)">
                <div class="checkbox"></div>
                <p class="label">{{ o.text }}</p>
              </li>
            </template>
          </ul>
        </ScrollBox>
        <button class="import-button" :disabled="!hasSelection" @click="importSelection">
          Import
        </button>
        <LabeledCheckbox
          v-if="enableLateralMoves"
          text="Include Lateral Moves"
          class="lateral-moves-checkbox"
          :checked="includeLateralMoves"
          @change="includeLateralMoves = !includeLateralMoves"
        />
      </div>
    </div>
  </Window>
</template>

<script lang="ts">
import Features from "@/assets/rey.features";
import * as Store from "@/store/StoreTypes";
// Dependencies
import { titleCase } from "@/assets/scripts/String";
import { Timeframe } from "@/assets/scripts/Collections/Timeframe";
import { mapActions } from "vuex";
import { RequestDebouncer } from "@/assets/scripts/WebUtilities/RequestDebouncer";
import { defineComponent, markRaw } from "vue";
const { enable_missed_lateral_movement_import: enableLateralMoves } = Features.import_export
// Components
import Window from "@/components/Containers/Window.vue";
import ScrollBox from "@/components/Containers/ScrollBox.vue";
import DateTimePicker from "@/components/Controls/DateTimePicker.vue";
import ChecklistLoader from "@/components/Icons/ChecklistLoader.vue";
import LabeledCheckbox from "@/components/Controls/LabeledCheckbox.vue";

export default defineComponent({
  name: "SetImportWindow",
  data() {
    return {
      loaders: {
        hosts: 10,
        users: 7,
        tactics: 5,
        techniques: 4,
        sets: 12
      },
      searchFilter: {
        hosts: "",
        users: "",
        tactics: "",
        techniques: "",
        sets: ""
      },
      filters: {
        hosts: [] as CheckboxItem[],
        users: [] as CheckboxItem[],
        tactics: [] as CheckboxItem[],
        techniques: [] as CheckboxItem[],
        timeRange: new Timeframe(24),
        timeframe: new Timeframe(24)
      },
      results: [] as CheckboxItem[],
      loadingFilters: true,
      loadingResults: true,
      includeLateralMoves: true,
      debouncer: markRaw(new RequestDebouncer<CheckboxItem[]>()),
      enableLateralMoves
    }
  },
  computed: {

    /**
     * Returns all option filters.
     * @returns
     *  All option filters.
     */
    options() {
      return {
        hosts: this.hosts, 
        users: this.users, 
        tactics: this.tactics, 
        techniques: this.techniques
      }
    },

    /**
     * Returns the set of host filters limited by search.
     * @returns
     *  The set of host filters limited by search.
     */
    hosts(): CheckboxItem[] {
      let match = this.searchFilter.hosts.toLocaleLowerCase();
      return this.filters.hosts
        .filter(o => o.text.toLocaleLowerCase().includes(match))
    },

    /**
     * Returns the set of user filters limited by search.
     * @returns
     *  The set of user filters limited by search.
     */
    users(): CheckboxItem[] {
      let match = this.searchFilter.users.toLocaleLowerCase();
      return this.filters.users
        .filter(o => o.text.toLocaleLowerCase().includes(match))
    },

    /**
     * Returns the set of tactic filters limited by search.
     * @returns
     *  The set of tactic filters limited by search.
     */
    tactics(): CheckboxItem[] {
      let match = this.searchFilter.tactics.toLocaleLowerCase();
      return this.filters.tactics
        .filter(o => o.text.toLocaleLowerCase().includes(match))
    },

    /**
     * Returns the set of technique filters limited by search.
     * @returns
     *  The set of technique filters limited by search.
     */
    techniques(): CheckboxItem[] {
      let match = this.searchFilter.techniques.toLocaleLowerCase();
      return this.filters.techniques
        .filter(o => o.text.toLocaleLowerCase().includes(match))
    },

    /**
     * Returns the activity set search results limited by search.
     * @returns
     *  The activity set search results limited by search.
     */
    sets(): CheckboxItem[] {
      let match = this.searchFilter.sets.toLocaleLowerCase();
      return this.results
        .filter(o => o.text.toLocaleLowerCase().includes(match));
    },
    
    /**
     * Returns true if at least one Activity Set is selected, false otherwise.
     * @returns
     *  True if at least one Activity Set is selected, false otherwise.
     */
    hasSelection(): boolean {
      for(let result of this.results) {
        if(result.value) return true;
      }
      return false;
    }

  },
  emits: ["grab", "close"],
  methods: {
    
    /**
     * Converts string to title case.
     */
    titleCase,

    /**
     * Activity Set API actions
     */
    ...mapActions("ActivitySetApi", [
      "fetchImportFilters",
      "searchActivitySets"
    ]),

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", ["openExceptionWindow"]),

    /**
     * Activity Set Importer actions
     */
    ...mapActions("ActivitySetImporter", ["importActivitySetFileById"]),

    /**
     * Window drag behavior.
     * @param event
     *  The pointer event.
     */
    onGrab(event: PointerEvent) {
      // Forward drag event from window component
      this.$emit("grab", event);
    },

    /**
     * Window close behavior.
     */
    onClose() {
      // Forward close event from window component
      this.$emit("close");
    },

    /**
     * Toggles a result checkbox.
     * @param item
     *  The checkbox to toggle.
     */
    toggleResult(item: CheckboxItem) {
      item.value = !item.value
    },

    /**
     * Toggles an option checkbox.
     * @param item
     *  The checkbox to toggle.
     */
    toggleOption(item: CheckboxItem) {
      item.value = !item.value;
      this.updateResults();
    },

    /**
     * Updates the timeframe's start time.
     * @param time
     *  The timeframe's new start time.
     */
    updateTimeframeBeg(time: Date) {
      this.filters.timeframe.beg = time;
      this.updateResults();
    },

    /**
     * Updates the timeframe's end time.
     * @param time
     *  The timeframe's new end time.
     */
    updateTimeframeEnd(time: Date) {
      this.filters.timeframe.end = time;
      this.updateResults();
    },

    /**
     * Reloads the import filters set.
     */
    async updateFilters() {
      this.loadingFilters = true;
      this.loadingResults = true;
      try {
        let f: Store.SetImportFilters = await this.fetchImportFilters();
        this.filters.hosts =
          f.hosts.map(text => ({ text, value: false }));
        this.filters.users =
          f.users.map(text => ({ text, value: false }));
        this.filters.tactics =
          f.tactics.map(text => ({ text, value: true }));
        this.filters.techniques =
          f.techniques.map(text => ({ text, value: true }));
        this.filters.timeRange =
          new Timeframe(f.time_range.min, f.time_range.max);
        this.filters.timeframe =
          this.filters.timeRange.copy();
      } catch(ex) {
        this.openExceptionWindow({ ex, src: "<SetImportWindow>" });
      }
      this.loadingFilters = false;
      this.updateResults();
    },

    /**
     * Reloads the search results according to the configured filters.
     */
    updateResults() {
      this.loadingResults = true;
      // Clear results
      this.results = [];
      // Run search
      this.debouncer.submit(this.runSearch());
    },

    /**
     * Runs an activity set search according to the configured filters.
     * @returns
     *  A Promise that resolves with the search results.
     */
    async runSearch(): Promise<CheckboxItem[]> {
      try {
        // Init search params
        let search: Store.SetImportFilters = {
          hosts: [],
          users: [],
          tactics: [],
          techniques: [],
          time_range: {
            min: this.filters.timeframe.beg as Date,
            max: this.filters.timeframe.end as Date
          }
        }
        // Populate search params
        for(let host of this.filters.hosts) 
          if(host.value) search.hosts.push(host.text);
        for(let user of this.filters.users) 
          if(user.value) search.users.push(user.text);
        for(let tactic of this.filters.tactics) 
          if(tactic.value) search.tactics.push(tactic.text);
        for(let technique of this.filters.techniques) 
          if(technique.value) search.techniques.push(technique.text);
        // Run search
        let results: string[] = await this.searchActivitySets(search);
        // Return
        return results.map(text => ({ text, value: true }));
      } catch(ex) {
        this.openExceptionWindow({ ex, src: "<SetImportWindow>" });
        return [];
      }
    },

    /**
     * Imports the currently selected Activity Sets.
     */
    async importSelection() {
      
      // Collect ids
      let ids = [];
      for(let result of this.results)
        if(result.value) ids.push(result.text);
      
      // Close window
      this.$emit("close");
      
      // Import ids
      try {
        await this.importActivitySetFileById({ 
          ids,
          importLateralMoves: this.enableLateralMoves && this.includeLateralMoves
        });
      } catch(ex) {
        this.openExceptionWindow({ ex, src: "<SetImportWindow>" });
      }

    }

  },
  async created() {
    // Configure request debouncer
    this.debouncer.onResult(results => {
      // Update search results
      this.results = results;
      this.loadingResults = false;
    });
    // Update filters
    await this.updateFilters();
  },
  components: {
    Window,
    ScrollBox,
    DateTimePicker,
    ChecklistLoader,
    LabeledCheckbox
  }
});

type CheckboxItem = {
  text: string,
  value: boolean
}

</script>

<style scoped>

/** === Main Window === */

.set-import-window {
  max-width: 950px;
}

.import-window {
  display: flex;
  flex-direction: row;
}

.filters-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  border-right: solid 1px #1c1c1c;
}

/** === Time Filters Section === */

.timeframe-select {
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  height: 60px;
  padding: 0px 15px;
  border-bottom: solid 1px #1c1c1c;
  box-sizing: border-box;
}
.datetime {
  display: flex;
  align-items: center;
  flex-direction: row;
}
.datetime p {
  color: #999999;
  font-size: 10pt;
  font-weight: 600;
  padding-right: 12px;
  user-select: none;
}
.span-mark {
  width: 100%;
  height: 1px;
  margin: 0px 30px;
  background: #4d4d4d;
}

/** === Option Filters Section === */

.options-select {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  height: 495px;
  padding: 10px 15px 15px;
  box-sizing: border-box;
}

.filter {
  display: flex;
  flex-direction: column;
  padding: 0px 8px;
  margin-left: 10px;
}
.filter:first-child {
  margin-left: 0px;
}

.filter.hosts { 
  grid-column: 1/2; 
  grid-row: 1/3;
}
.filter.users {
  grid-column: 2/3;
  grid-row: 1/3;
}
.filter.tactics {
  grid-column: 3/4;
  grid-row: 1/2;
  padding-bottom: 5px;
}
.filter.techniques {
  grid-column: 3/4;
  grid-row: 2/3;
  margin-top: 5px;
}

.section-title { 
  color: #999999;
  font-size: 10pt;
  font-weight: 600;
  margin-bottom: 6px;
  user-select: none;
}

.search-filter-input {
  margin: 0px 25px 9px 0px;
}

.scrollbox :deep(.scroll-bar) {
  border-radius: 4px;
  background: #242424;
}

ul {
  padding-right: 8px;
}

li {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  color: #8c8c8c;
  font-size: 10pt;
  font-weight: 500;
  border: solid 1px #4d4d4d;
  border-radius: 3px;
  margin-bottom: 3px;
  list-style-type:none;
  user-select: none;
}
li:last-child {
  margin-bottom: 0px;
}
li:hover {
  background: #323232;
}

li .label {
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px 0px;
  margin-right: 8px;
  overflow: hidden;
}
li.active .label {
  color: #bfbfbf;
}

li .checkbox {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  color: #b6b6b6;
  font-size: 10pt;
  font-weight: 600;
  border-right: solid 1px #4d4d4d;
  margin-right: 8px;
}
li.active .checkbox::before {
  content: "✓";
}

/** === Results Section === */

.results-section {
  display: flex;
  flex-direction: column;
  width: 230px;
  padding: 10px 15px 15px;
  box-sizing: border-box;
}

.import-button {
  height: 29px;
  margin-top: 10px;
}

.lateral-moves-checkbox {
  color: #bfbfbf;
  height: 14px;
  padding: 5px 0px;
  border: solid 1px #4d4d4d;
  border-radius: 3px;
  margin-top: 5px;
  background: #323232;
}

/** === No Listing Item === */

.no-listing {
  color: #999;
  font-size: 10pt;
  font-style: italic;
  text-align: center;
  padding: 8px;
  border: dotted 1px #4d4d4d;
  border-radius: 3px;
  user-select: none;
}

</style>
