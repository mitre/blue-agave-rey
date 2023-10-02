<template>
  <div class="group-matching-tab-element" @contextmenu.stop>
    <ScrollBox class="scrollbox">
      <div class="sections">
        <div class="section-container">
          <div class="section-header">
            <div class="title">
              Activity Sets resemble the following groups:
            </div>
            <HelpTooltip direction="left" :width="150" :text="groupsHelpText"/>
          </div>
          <div class="section-content loading" v-if="isLoading">
            <SpinLoader class="spinner" :size="25" />
            <span>Matching Activity</span>
          </div>
          <div class="section-content no-match" v-else-if="matches === null">
            <span>Select an activity set to view matched groups.</span>
          </div>
          <div class="section-content no-match" v-else-if="matches.matching_groups.length === 0">
            <span>Activity did not resemble any known groups.</span>
          </div>
          <ul class="section-content" v-else>
            <li class="group-section" v-for="match in matches!.matching_groups" :key="match.group_id">
              <div class="group-header" @click="toggleGroupBody(match.group_id)">
                <div class="group-title">
                  <div class="rank">#{{ match.rank }}</div>
                  <div class="title">{{ match.name }}</div>
                </div>
                <Collapse class="collapse-icon" color="#808080" :collapse="!isGroupBodyVisible(match.group_id)"/>
              </div>
              <div class="group-body" v-if="isGroupBodyVisible(match.group_id)">
                <div class="group-description">
                  {{ match.description }}
                </div>
                <div class="group-footer">
                  <p class="id">ID: {{ match.group_id }}</p>
                  <a class="link" :href="match.attack_link" target="_blank">Learn More ↗</a>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div class="section-container">
          <div class="section-header">
            <div class="title">
              Selected Activity Sets:
            </div>
            <HelpTooltip direction="left" :width="150" :text="selectHelpText"/>
          </div>
          <div class="section-content no-sets" v-if="sets.length === 0">
            <span>Select an activity set to view matched groups.</span>
          </div>
          <ul class="section-content" v-else>
            <li class="set-section" v-for="set in sets" :key="set.id">
              <div class="set-header" @click="toggleSetBody(set.id)">
                <div class="set-title">
                  <Key class="icon" color="#ef684d" />
                  <div class="title">{{ set.id.substring(0, 8).toLocaleUpperCase() }}</div>
                </div>
                <Collapse class="collapse-icon" color="#808080" :collapse="!isSetBodyVisible(set.id)"/>
              </div>
              <div class="set-table" v-if="isSetBodyVisible(set.id)">
                <div class="set-table-cell">
                  <Graph class="icon" color="#808080"/>
                  <span class="text">{{ set.events }} Events, {{ set.analytics }} Analytics</span>
                </div>
                <div class="set-table-cell">
                  <User class="icon" color="#808080"/>
                  <span class="text">{{ formatKeys(set.users) }}</span>
                </div>
                <div class="set-table-cell">
                  <Clock class="icon" color="#808080"/>
                  <span class="text">{{ formatDate(set.duration.beg) }}</span>
                </div>
                <div class="set-table-cell">
                  <Monitor class="icon" color="#808080"/>
                  <span class="text">{{ formatKeys(set.hosts) }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </ScrollBox>
  </div>
</template>

<script lang="ts">
// Dependencies
import * as Store from "@/store/StoreTypes";
import { ActivitySetInfo } from "@/assets/scripts/ViewData/ActivitySetInfo";
import { RequestDebouncer } from "@/assets/scripts/WebUtilities/RequestDebouncer";
import { mapActions, mapState } from "vuex";
import { MatchedMitreAttackGroups } from "@/store/StoreTypes";
import { defineComponent, markRaw, PropType } from "vue";
import { format12HourTime, format24HourTime, formatDateCal } from "@/assets/scripts/Visualizations/Time";
// Components
import Key from "../Icons/Key.vue";
import User from "../Icons/User.vue"
import Graph from "../Icons/Graph.vue";
import Clock from "../Icons/Clock.vue";
import Monitor from "../Icons/Monitor.vue";
import Collapse from "../Icons/Collapse.vue";
import ScrollBox from "../Containers/ScrollBox.vue";
import SpinLoader from "../Icons/SpinLoader.vue";
import HelpTooltip from "../Controls/HelpTooltip.vue";

export default defineComponent({
  name: "GroupMatchingTab",
  props: {
    sets: {
      type: Array as PropType<ActivitySetInfo[]>,
      required: true
    }
  },
  data() {
    return {
      isLoading: false,
      matches: null as null | MatchedMitreAttackGroups,
      matchedSets: "",
      viewSet: new Set<string>(),
      viewGroup: new Set<string>(),
      debouncer: markRaw(new RequestDebouncer<MatchedMitreAttackGroups>()),
      selectHelpText: "Here is a really long string that talks about selection.",
      groupsHelpText: "Here is a really long string that talks about grouping."
    }
  },
  computed: {

    /**
     * App Settings Store data
     */
    ...mapState("AppSettingsStore", {
      display24HourTime(state: Store.AppSettingsStore): boolean {
        return state.settings.view.app.display_24_hour_time;
      }
    })

  },
  methods: {

    /**
     * Activity Sets Store actions
     */
    ...mapActions("ActivitySetApi", ["matchActivitySets"]),

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", ["openExceptionWindow"]),
    
    /**
     * Matches configured activity sets to a set of ATT&CK groups.
     */
    async matchGroups() {
      // If no new activity...
      if(!this.hasNewActivitySets()) {
        // Bail
        return;
      }
      if(this.sets.length === 0) {
        this.matches = null;
      } else {
        this.isLoading = true;
        this.debouncer.submit(this.matchActivitySets(this.sets));
      }
      this.updateMatchedActivitySets();
    },

    /**
     * Tests if there's new activity sets to evaluate.
     * @returns
     *  True if there's new activity sets, false otherwise.
     */
    hasNewActivitySets(): boolean {
      if(this.sets.length === 0) {
        if(this.matchedSets === "") {
          return false;
        }
        return true;
      }
      let matchedSets = this.sets.map(o => o.id).sort().join(".");
      if(this.matchedSets === matchedSets) {
        return false;
      }
      return true;
    },

    /**
     * Sets the currently matched activity sets.
     */
    updateMatchedActivitySets() {
      this.matchedSets = this.sets.map(o => o.id).sort().join(".");
    },

    /**
     * Formats a Map's keys as a string.
     * @param map
     *  A Map.
     * @returns
     *  The Map's keys formatted as a string.
     */
    formatKeys(map: Map<any, any>): string {
      return [...map.keys()].filter(Boolean).join(", ");
    },

    /**
     * Formats a date as a string.
     * @param date
     *  A date.
     * @returns
     *  The date formatted as a string.
     */
    formatDate(date: Date): string {
      let formatTime = this.display24HourTime ? format24HourTime : format12HourTime;
      return `${ formatDateCal(date) } ${ formatTime(date, 0) }`;
    },

    /**
     * Toggles an activity set's body on and off.
     * @param id
     *  The activity set to toggle.
     */
     toggleSetBody(id: string) {
      if(this.viewSet.has(id)) {
        this.viewSet.delete(id)
      } else {
        this.viewSet.add(id)
      }
    },

    /**
     * Tests if an activity set's body is visible are not.
     * @param id
     *  The activity set's id.
     * @returns
     *  True if the activity set's body is visible, false otherwise.
     */
    isSetBodyVisible(id: string): boolean {
      return this.viewSet.has(id);
    },

    /**
     * Toggles a group's body on and off.
     * @param id
     *  The group to toggle.
     */
    toggleGroupBody(id: string) {
      if(this.viewGroup.has(id)) {
        this.viewGroup.delete(id)
      } else {
        this.viewGroup.add(id)
      }
    },

    /**
     * Tests if a group's body is visible are not.
     * @param id
     *  The group's id.
     * @returns
     *  True if the group's body is visible, false otherwise.
     */
    isGroupBodyVisible(id: string): boolean {
      return this.viewGroup.has(id);
    },

  },
  watch: {
    // On sets change
    sets() {
      this.matchGroups();
    }
  },
  created() {
    // Configure request debouncer
    this.debouncer
      .onResult(matches => {
        // Clear group view toggles
        this.viewGroup.clear();
        // Update matches
        this.matches = matches;
        this.isLoading = false;
      })
      .onError(ex => {
        // Raise exception
        this.openExceptionWindow({ ex, src: "<GroupMatchingTab>" });
        this.matches = null;
        this.isLoading = false;
      });
  },
  async mounted() {
    await this.matchGroups();
  },
  components: { 
    Key, User, Graph, Clock, Monitor, 
    SpinLoader, Collapse, ScrollBox, HelpTooltip
  }
});
</script>

<style scoped>

/** === Main Element === */

.group-matching-tab-element {
  height: 100%;
}

.scrollbox {
  height: 100%;
}

/** === Main Sections === */

.sections {
  width: 100%;
  padding: 15px 12px;
  box-sizing: border-box;
}

.section-container {
  border: solid 1px #383838;
  border-radius: 3px;
  margin-bottom: 12px;
  background: #242424;
  user-select: text;
}

.section-container:last-child {
  margin-bottom: 0px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #d9d9d9;
  font-size: 10.5pt;
  font-weight: 500;
  padding: 10px 20px;
  border-bottom: solid 1px #383838;
  background: #2b2b2b;
}

.section-content {
  padding: 0px 9px;
}

/** === Group and Set Sections === */

.group-section,
.set-section {
  list-style: none;
  padding: 16px 11px;
  border-bottom: solid 1px #383838;
}

.group-section:last-child,
.set-section:last-child {
  border-bottom: none;
}

.group-header,
.set-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  cursor: pointer;
}

.group-header:hover .collapse-icon :deep(path),
.set-header:hover .collapse-icon :deep(path) {
  fill: #bfbfbf;
}

/** === Group Section === */

.group-header:hover .title {
  color: #fff;
}

.group-title {
  display: flex;
  align-items: center;
  width: 100%;
}

.group-title .rank {
  display: inline-block;
  color: #fff;
  font-size: 10.5pt;
  font-weight: 700;
  padding: 5px 9px;
  border-radius: 3px;
  margin-right: 10px;
  background: #f95939;
}

.group-title .title {
  display: inline-block;
  color: #d9d9d9;
  font-size: 13pt;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.group-description {
  color: #cccccc;
  font-size: 10pt;
  font-weight: 500;
  line-height: 13.5pt;
  margin: 12px 0px;
}

.group-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-footer .id {
  color: #d9d9d9;
  font-size: 10pt;
  font-weight: 500;
  font-family: "Roboto Mono", "monospace";
}

.group-footer .link {
  color: #ef684d;
  font-size: 10.5pt;
  font-family: 600;
  text-decoration: underline;
}

/** === Set Section === */

.set-header .collapse-icon {
  height: 12px;
}

.set-title {
  display: flex;
  align-items: center;
}

.set-title .icon {
  width: 15px;
  height: 15px;
  margin-right: 9px;
}

.set-title .title {
  color: #ef684d;
  font-size: 11pt;
  font-weight: 700;
  font-family: "Roboto Mono", "monospace";
  line-height: 10pt;
  padding-bottom: 1px;
}

.set-table {
  display: grid;
  row-gap: 8px;
  column-gap: 10px;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  margin-top: 12px;
}

.set-table-cell {
  display: flex;
  align-items: center;
}

.set-table-cell .icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 9px;
}

.set-table-cell .text {
  flex: 1;
  color: #cccccc;
  font-size: 10pt;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/** === No Sets === */

.no-sets span,
.no-match span {
  display: block;
  color: #999999;
  font-size: 10.5pt;
  font-weight: 500;
  font-style: italic;
  text-align: center;
  user-select: none;
}

.no-sets {
  margin: 50px 0px;
}

.no-match {
  margin: 25px 0px;
}

/** === Loading Groups === */

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaaaaa;
  font-size: 11pt;
  font-weight: 500;
  margin: 25px 0px;
}

.loading .spinner {
  margin-right: 6px;
}

</style>
