<template>
  <div class="app-footer-element" :class="{ 'hour-24': display24HourTime }">
    <div class="left-complications">
      <div class="complication beg-time">
        <ClockBeg class="icon" />
        <div class="timestamp">
          <p class="date">{{ focusBeg.date }}</p>
          <p class="time">{{ focusBeg.time }}</p>
          <p class="ms">{{ focusBeg.ms }}</p>
        </div>
      </div>
      <div class="complication end-time">
        <ClockEnd class="icon" />
        <div class="timestamp">
          <p class="date">{{ focusEnd.date }}</p>
          <p class="time">{{ focusEnd.time }}</p>
          <p class="ms">{{ focusEnd.ms }}</p>
        </div>
      </div>
      <div class="complication duration">
        <Duration class="icon" />
        <p>{{ durationText }}</p>
      </div>
    </div>
    <div class="right-complications">
      <div class="complication delta" :style="{ opacity: delta.show ? 1 : 0 }">
        {{ delta.text }}
      </div>
      <div class="complication timeline" v-if="!timelineVisible" @click="showTimeline(true)">
        <p><span>⇪</span> Open Timeline</p>
      </div>
      <div class="complication selected">
        <p><span>Selected:</span> {{ selected }} / {{ totalNodes }}</p>
      </div>
      <div class="complication sets">
        <p><span>Sets:</span> {{ sets }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
// Dependencies
import { Timeframe } from "@/assets/scripts/Collections/Timeframe";
import { defineComponent } from "vue";
import { mapActions, mapState } from "vuex";
import { formatDateCal, formatTime, formatDuration } from '@/assets/scripts/Visualizations/Time';
import type { ActivitySetCommonNode } from "@/assets/scripts/ViewData/ViewNode";
// Components
import ClockBeg from "@/components/Icons/ClockBeg.vue";
import ClockEnd from "@/components/Icons/ClockEnd.vue";
import Duration from "@/components/Icons/Duration.vue";

export default defineComponent({
  name: "AppFooter",
  data() {
    return {
      duration: -1,
      durationText: "",
      delta: {
        tid: 0,
        text: "",
        show: false,
        lastBeg: 0,
        lastEnd: 0,
        focusBeg: 0,
        focusEnd: 0,
        timeout: 1500
      },
      totalNodes: 0
    }
  },
  computed: {

    /**
     * Activity Sets Store data
     */
    ...mapState<any, {
      triggerDataLoaded: (state: Store.ActivitySetsStore) => number,
      triggerDataFocused: (state: Store.ActivitySetsStore) => number,
      focus: (state: Store.ActivitySetsStore) => Timeframe,
      sets: (state: Store.ActivitySetsStore) => number,
      nodes: (state: Store.ActivitySetsStore) => Map<string, ActivitySetCommonNode>,
      selected: (state: Store.ActivitySetsStore) => number
    }>("ActivitySetsStore", {
      triggerDataLoaded(state: Store.ActivitySetsStore): number {
        return state.triggerDataLoaded;
      },
      triggerDataFocused(state: Store.ActivitySetsStore): number {
        return state.triggerDataFocused;
      },
      focus(state: Store.ActivitySetsStore): Timeframe {
        return state.focus;
      },
      sets(state: Store.ActivitySetsStore): number {
        return state.sets.size;
      },
      nodes(state: Store.ActivitySetsStore): Map<string, ActivitySetCommonNode> {
        return state.nodes;
      },
      selected(state: Store.ActivitySetsStore): number {
        // Returns the number of nodes currently selected
        return [...state.selected.values()]
          .reduce((a, b) => a + (/->/.test(b.id) ? 0 : 1), 0);
      }
    }),

    /**
     * App Settings Store data
     */
    ...mapState<any, {
      display24HourTime: (state: Store.AppSettingsStore) => boolean,
      timelineVisible: (state: Store.AppSettingsStore) => boolean
    }>("AppSettingsStore", {
      display24HourTime(state: Store.AppSettingsStore): boolean {
        return state.settings.view.app.display_24_hour_time;
      },
      timelineVisible(state: Store.AppSettingsStore): boolean {
        return state.settings.view.app.appearance.timeline;
      }
    }),

    /**
     * Returns the focus start time formatted as a set of strings.
     * @returns
     *  [date]
     *   The date portion of the start time.
     *  [time]
     *   The time portion of the start time.
     *  [ms]
     *   The remaining milliseconds portion of the start time.
     */
    focusBeg(): { date: string, time: string, ms: string } {
      let beg = this.focus.beg;
      // Format date
      let date = formatDateCal(beg).toLocaleUpperCase();
      // Format time
      let time, ms;
      if(this.display24HourTime) {
        let t = formatTime(beg, true);
        time = `${ t.hour }:${ t.min }:${ t.sec }`;
        ms = `(.${ t.ms })`
      } else {
        let t = formatTime(beg, false);
        time = `${ t.hour }:${ t.min }:${ t.sec } ${ t.meridiem }`;
        ms = `(.${ t.ms })`
      }
      return { date, time, ms }   
    },

    /**
     * Returns the focus end time formatted as a set of strings.
     * @returns
     *  [date]
     *   The date portion of the end time.
     *  [time]
     *   The time portion of the end time.
     *  [ms]
     *   The remaining milliseconds portion of the end time.
     */
    focusEnd(): { date: string, time: string, ms: string } {
      let end = this.focus.end;
      // Format date
      let date = formatDateCal(end).toLocaleUpperCase();
      // Format time
      let time, ms;
      if(this.display24HourTime) {
        let t = formatTime(end, true);
        time = `${ t.hour }:${ t.min }:${ t.sec }`;
        ms = `(.${ t.ms })`
      } else {
        let t = formatTime(end, false);
        time = `${ t.hour }:${ t.min }:${ t.sec } ${ t.meridiem }`;
        ms = `(.${ t.ms })`
      }
      return { date, time, ms }   
    }

  },
  methods: {

    /**
     * App Settings Store actions
     */
    ...mapActions("AppSettingsStore", [
      "showTimeline"
    ]),

    /**
     * Updates the time delta complication.
     */
    updateDeltaComplication() {
      let beg = this.focus.beg.getTime();
      let end = this.focus.end.getTime();
      let begShift = beg - this.delta.lastBeg;
      let endShift = end - this.delta.lastEnd;
      // Ignore if nothing happened
      if(!begShift && !endShift)
        return;
      // Ignore if zoom event
      if(begShift && endShift && begShift !== endShift) {
        this.delta.lastBeg = beg;
        this.delta.lastEnd = end;
        this.delta.focusBeg = beg;
        this.delta.focusEnd = end;
        return;
      }
      // Update delta
      if(begShift) {  
        this.delta.text = `${
          formatDuration(beg, this.delta.focusBeg) 
        } ${ 
          this.delta.focusBeg <= beg ? "→" : "←"
        }`;
      } else if(endShift) {
        this.delta.text = `${
          formatDuration(end, this.delta.focusEnd)
        } ${ 
          this.delta.focusEnd <= end ? "→" : "←"
        }`;
      }
      // Update last focus and show delta
      this.delta.show = true;
      this.delta.lastBeg = beg;
      this.delta.lastEnd = end;
      // Reset timeout
      clearTimeout(this.delta.tid);
      this.delta.tid = setTimeout(() => {
        this.delta.show = false;
        this.delta.focusBeg = beg;
        this.delta.focusEnd = end;
      }, this.delta.timeout);
    },

    /**
     * Updates the duration complication.
     */
    updateDurationComplication() {
      let duration = this.focus.getDuration();
      if(this.duration !== duration) {
        // Update duration
        this.duration = duration;
        // Update duration text 
        this.durationText = formatDuration(
          this.focus.beg.getTime(), 
          this.focus.end.getTime()
        );
      }
    }

  },
  watch: {
    // On data loaded trigger
    triggerDataLoaded() {
      this.totalNodes = this.nodes.size;
    },
    // On data focused trigger
    triggerDataFocused() {
      this.updateDurationComplication();
      this.updateDeltaComplication();
    }
  },
  mounted() {
    // Set total # of nodes
    this.totalNodes = this.nodes.size;
    // Set initial duration
    this.updateDurationComplication();
    // Set initial focus
    this.delta.focusBeg = this.focus.beg.getTime();
    this.delta.focusEnd = this.focus.end.getTime();
  },
  components: { ClockBeg, ClockEnd, Duration }
});
</script>

<style scoped>

/** === Main Element === */

.app-footer-element {
  color: #b2b2b2;
  font-size: 9pt;
  font-weight: 500;
  padding: 0px 5px;
}

.timestamp,
.complication,
.app-footer-element,
.left-complications,
.right-complications {
  display: flex;
  align-items: center;
  height: 100%;
}

.right-complications {
  margin-left: auto;
}

/** === Left Complications === */

.complication.beg-time,
.complication.end-time {
  min-width: 230px;
  padding-left: 10px;
}

.hour-24 .complication.beg-time,
.hour-24 .complication.end-time {
  min-width: 208px;
}

.complication.duration {
  padding-left: 10px;
}

/** === Right Complications === */

.complication.sets,
.complication.delta,
.complication.selected,
.complication.timeline {
  padding: 0px 10px;
}

/** === Complications === */

.complication {
  box-sizing: border-box;
  transition: .15s opacity;
}

.complication span {
  color: #8c8c8c;
}

.icon {
  width: auto;
  height: 13px;
  margin-right: 8px;
}

.timestamp .date {
  color: #8c8c8c;
  margin-right: 8px;
}

.timestamp .time {
  color: #b2b2b2;
  margin-right: 8px;
}

.timestamp .ms {
  color: #8c8c8c;
}

.complication.delta {
  color: #fff;
  background: #f95939;
}

.complication.timeline {
  cursor: pointer;
}
.complication.timeline:hover,
.complication.timeline:hover span {
  color: #fff;
  background: #f95939;
}

/** === Media Queries === */

@media screen and (max-width: 1050px) {
  .complication.beg-time,
  .complication.end-time {
    min-width: 187px;
  }
  .hour-24 .complication.beg-time,
  .hour-24 .complication.end-time {
    min-width: 165px;
  }
  .complication .ms {
    display: none;
  }
}

@media screen and (max-width: 957px) {
  .complication.duration {
    display: none;
  }
}

@media screen and (max-width: 800px) {
  .complication.sets,
  .complication.delta {
    display: none;
  }
}

@media screen and (max-width: 550px) {
  .complication.selected {
    display: none;
  }
}

</style>
