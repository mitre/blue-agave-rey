<template>
  <TabBox class="selection-tabs-element" v-model="active" :canClose="canClose" @close="$emit('close')">
    <Tab name="Details" class="tab">
      <ScrollBox v-if="events.length > 0" class="scrollbox">
        <div class="list">
          <EventListing 
            class="listing" 
            v-for="event in visibleEvents" 
            :key="event.id" 
            :event="event"
          />
          <div class="end-of-results" v-if="visibleEvents.length !== events.length">
            For performance reasons, the number of displayed 
            events is currently limited to {{ maxItems }}.
          </div>
        </div>
      </ScrollBox>
      <div v-else class="no-selection">
        <span>Select an event to view its details.</span>
      </div>
    </Tab>
    <Tab name="Alerts" class="tab">
      <ScrollBox v-if="analytics.length > 0" class="scrollbox">
        <div class="list">
          <EventListing
            class="listing"
            v-for="analytic in visibleAnalytics"
            :key="analytic.id"
            :event="analytic"
          />
          <div class="end-of-results" v-if="visibleAnalytics.length !== analytics.length">
            For performance reasons, the number of displayed 
            analytics is currently limited to {{ maxItems }}.
          </div>
        </div>
      </ScrollBox>
      <div v-else class="no-selection">
        <span>Select an event with analytics attached.</span>
      </div>
    </Tab>
    <Tab name="Activity Sets" class="tab">
      <ScrollBox v-if="visibleSets.length > 0" class="scrollbox">
        <div class="list">
          <ActivitySetListing
            class="listing"
            v-for="set in visibleSets"
            :key="set.id"
            :set="set"
          />
          <div class="end-of-results" v-if="visibleSets.length !== sets.length">
            For performance reasons, the number of displayed 
            activity sets is currently limited to {{ maxItems }}.
          </div>
        </div>
      </ScrollBox>
      <div v-else class="no-selection">
        <span>Select an event to view its activity set details.</span>
      </div>
    </Tab>
    <Tab name="Groups" class="tab" v-if="displayMatchingTab">
      <GroupMatchingTab :sets="sets"></GroupMatchingTab>
    </Tab>
  </TabBox>
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
import * as Features from "@/assets/rey.features";
// Dependencies
import { mapState } from "vuex";
import { defineComponent } from "vue";
import { ActivitySetInfo } from "@/assets/scripts/ViewData/ActivitySetInfo";
import { GenericViewItem } from "@/assets/scripts/Visualizations/ViewBaseTypes/GenericViewItem";
import { ActivitySetCommonNode, ActivitySetViewNode } from "@/assets/scripts/ViewData/ViewNode";
// Components
import Tab from "@/components/Containers/Tab.vue";
import TabBox from "@/components/Containers/TabBox.vue";
import ScrollBox from "@/components/Containers/ScrollBox.vue";
import EventListing from "@/components/Panels/EventListing.vue";
import GroupMatchingTab from "./GroupMatchingTab.vue";
import ActivitySetListing from "@/components/Panels/ActivitySetListing.vue";

export default defineComponent({
  name: "SelectionTabs",
  props: {
    canClose: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      active: 0,
      maxItems: 10,
      displayMatchingTab: Features.group_matching.enable_activity_set_group_matching
    }
  },
  computed: {
    
    /**
     * Activity Sets Store data
     */
    ...mapState("ActivitySetsStore", {
      selected(state: Store.ActivitySetsStore): Map<string, GenericViewItem> {
        return state.selected
      },
      activitySets(state: Store.ActivitySetsStore): Map<string, ActivitySetInfo> {
        return state.sets;
      }
    }),

    /**
     * Returns the selected nodes that are visible.
     * @returns
     *  The selected nodes that are visible.
     */
    visibleEvents(): ActivitySetCommonNode[] {
      return this.events.slice(0, this.maxItems);
    },

    /**
     * Returns the selected analytics that are visible.
     * @returns
     *  The selected analytics that are visible.
     */
    visibleAnalytics(): ActivitySetCommonNode[] {
      return this.analytics.slice(0, this.maxItems);
    },

    /**
     * Returns the selected activity sets that are visible.
     * @returns
     *  The selected activity sets that are visible.
     */
    visibleSets(): ActivitySetInfo[] {
      return this.sets.slice(0, this.maxItems);
    },

    /**
     * Returns the current selection.
     * @returns
     *  The current selection.
     */
    events(): ActivitySetCommonNode[] {
      return [...this.selected.values()]
        .filter(
          o => !/->/.test(o.id)
        ).sort(
          (a, b) => b.time.getTime() - a.time.getTime()
        ) as ActivitySetCommonNode[]
    },

    /**
     * Returns the set of analytics attached to the current selection.
     * @returns
     *  The set of analytics attached to the current selection.
     */
    analytics(): ActivitySetCommonNode[] {
      let analytics: ActivitySetCommonNode[] = [];
      for(let event of this.events) {
        for(let e of event.next) {
          if(e.target.isAnalytic())
            analytics.push(e.target);
        }
      }
      return analytics.sort(
        (a, b) => b.time.getTime() - a.time.getTime()
      );
    },

    /**
     * Returns all activity sets associated with the current selection.
     * @returns
     *  All activity sets associated with the current selection.
     */
    sets(): ActivitySetInfo[] {
      let sets = new Map<string, ActivitySetInfo>();
      for(let node of this.selected.values()) {
        if(node instanceof ActivitySetViewNode) {
          sets.set(node.set, this.activitySets.get(node.set)!);
        }
      }
      return [...sets.values()].sort(
        (a,b) => a.duration.beg.getTime() - b.duration.beg.getTime()
      )
    }

  },
  emits: ["close"],
  components: { 
    Tab, TabBox, ScrollBox, EventListing,
    GroupMatchingTab, ActivitySetListing
  }
});
</script>

<style scoped>

/** === Event Listings === */

.tab {
  overflow: hidden;
}

.scrollbox {
  height: 100%;
}

.list {
  width: 100%;
  padding: 15px 12px;
  box-sizing: border-box;
}

.listing {
  margin-bottom: 20px;
}
.listing:last-child {
  margin-bottom: 0px;
}

.end-of-results {
  color: #a6a6a6;
  font-size: 10pt;
  padding: 10px 12px;
  border: solid 1px #383838;
  border-radius: 3px;
  background: #2b2b2b;
}

/** === No Selection === */

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #808080;
  font-size: 10pt;
  font-weight: 500;
  font-style: italic;
  width: 100%;
  height: 100%;
}

</style>
