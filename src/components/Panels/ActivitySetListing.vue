<template>
  <div class="activity-set-listing-panel" @contextmenu.stop>
    <div class="header">
      <div class="header-info">
        <div class="subtitle">Activity Set</div>
        <div class="title">{{ set.id.substring(0, idLength).toUpperCase() }}</div>
      </div>
    </div>
    <div class="section classification" v-if="showClass">
      <div class="name">Classification</div> 
      <div class="content">
        <div class="sbs-blocks">
          <div class="block padded class">
            <p class="type">Class</p>
            <p class="text">{{ setClass }}</p>
          </div>
          <div class="block padded details">
            <p class="type">Scored By</p>
            <p class="text">{{ set.score.scored_by }}</p>
            <hr />
            <p class="type">Description</p>
            <p class="text">{{ set.score.description }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="section node-types">
      <div class="name">Node Types</div> 
      <div class="content">
        <div class="sbs-blocks">
          <div class="block padded">
            <p class="type">Event Count</p>
            <p class="text">{{ set.events }}</p>
          </div>
          <div class="block padded">
            <p class="type">Analytic Count</p>
            <p class="text">{{ set.analytics }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="section breakdown" v-for="(bd, name) of setBreakdowns" :key="name">
      <div class="name">{{ name }} Breakdown</div> 
      <div class="content">
        <div class="breakdown-table">
          <div class="row" v-for="o of bd" :key="o.text">
            <p class="cell text">
              {{ o.text ?? 'None' }}
            </p>
            <p class="cell count">
              {{ o.amount }} <span>({{ o.percent }}%)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="section time-info">
      <div class="name">Time</div> 
      <div class="content">
        <div class="sbs-blocks times">
          <div class="block">
            <div class="type">Start Time</div>
            <div class="date-time">
              <p class="date">{{ setBegTime.date }}</p>
              <p class="time">{{ setBegTime.time }}</p>
            </div>
          </div>
          <div class="block">
            <div class="type">End Time</div>
            <div class="date-time">
              <p class="date">{{ setEndTime.date }}</p>
              <p class="time">{{ setEndTime.time }}</p>
            </div>
          </div>
        </div>
        <div class="block padded duration">
          <p class="type">Duration</p>
          <p class="text">{{ setDuration }}</p>
        </div>
      </div>
    </div>
    <div class="section activity-set-id">
      <div class="name">Activity Set ID</div> 
      <div class="content">
        <span class="code-block">{{ set.id }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Features from "@/assets/rey.features"
// Dependencies
import { ActivitySetInfo } from "@/assets/scripts/ViewData/ActivitySetInfo";
import { defineComponent, PropType } from "vue";
import { 
  formatDateCal,
  formatDuration,
  format12HourTime
} from "@/assets/scripts/Visualizations/Time";
// Feature Configurations
let { activity_set_id_length } = Features.activity_set_listing;
let { enable_activity_set_classification } = Features.classification;

export default defineComponent({
  name: "ActivitySetListing",
  props: {
    set: {
      type: Object as PropType<ActivitySetInfo>,
      required: true
    }
  },
  data() {
    return {
      idLength: activity_set_id_length,
      showClass: enable_activity_set_classification
    }
  },
  computed: {
    
    /**
     * Returns the Activity Set's class.
     * @returns
     *  The Activity Set's class.
     */
    setClass(): string {
      return this.set.score.value < 0.5 ? "Benign" : "Malicious";
    },

    /**
     * Returns the Activity Set's breakdowns.
     * @returns
     *  The Activity Set's breakdowns.
     */
    setBreakdowns() {
      return {
        "Tactic": this.tacticBreakdown,
        "Technique": this.techniqueBreakdown,
        "User": this.userBreakdown,
        "Host": this.hostBreakdown
      }
    },

    /**
     * Returns the Activity Set's tactic breakdown.
     * @returns
     *  The Activity Set's tactic breakdown. 
     */
    tacticBreakdown(): BreakdownItem[] {
      return this.calculateBreakdown(this.set.tactics, this.set.events);
    },

    /**
     * Returns the Activity Set's technique breakdown.
     * @returns
     *  The Activity Set's technique breakdown. 
     */
    techniqueBreakdown(): BreakdownItem[] {
      return this.calculateBreakdown(this.set.techniques, this.set.events);
    },

    /**
     * Returns the Activity Set's user breakdown.
     * @returns
     *  The Activity Set's user breakdown. 
     */
    userBreakdown(): BreakdownItem[] {
      return this.calculateBreakdown(this.set.users, this.set.events);
    },

    /**
     * Returns the Activity Set's host breakdown.
     * @returns
     *  The Activity Set's host breakdown. 
     */
    hostBreakdown(): BreakdownItem[] {
      return this.calculateBreakdown(this.set.hosts, this.set.events);
    },

    /**
     * Returns the Activity Set's start time.
     * @returns
     *  The Activity Set's start time.
     */
    setBegTime(): { date: string, time: string } {
      return {
        date: formatDateCal(this.set.duration.beg).toLocaleUpperCase(),
        time: format12HourTime(this.set.duration.beg, 1)
      }
    },

    /**
     * Returns the Activity Set's end time.
     * @returns
     *  The Activity Set's end time.
     */
    setEndTime(): { date: string, time: string } {
      return {
        date: formatDateCal(this.set.duration.end).toLocaleUpperCase(),
        time: format12HourTime(this.set.duration.end, 1)
      }
    },

    /**
     * Returns the Activity Set's duration.
     * @returns
     *  The Activity Set's duration.
     */
    setDuration(): string {
      return formatDuration(
        this.set.duration.beg.getTime(),
        this.set.duration.end.getTime(),
        {
          day : "days",
          hr  : "hours",
          min : "minutes",
          sec : "seconds",
        }
      );
    }

  },
  methods: {

    /**
     * Breaks down a list of tallied items.
     * @param list
     *  The list to evaluate.
     * @param total
     *  The total number of items.
     * @return
     *  The list's breakdown.
     */
    calculateBreakdown(list: Map<string, number>, total: number): BreakdownItem[] {
      let breakdown = [];
      for(let [text, amount] of list) {
        breakdown.push({ 
          text,
          amount,
          percent: Math.round((amount / total) * 100)
        });
      }
      return breakdown.sort((a,b) => b.percent - a.percent);
    }

  }
});

type BreakdownItem = {
  text: string,
  amount: number,
  percent: number
}

</script>

<style scoped>

/** === Main Panel === */

.activity-set-listing-panel {
  border: solid 1px #383838;
  border-radius: 3px;
  background: #242424;
  user-select: text;
  overflow: hidden;
}

/** === Header === */

.header {
  display: flex;
  flex-direction: row;
  padding: 8px 10px;
  border-bottom: solid 1px #383838;
  margin-bottom: 9px;
  background: #2b2b2b;
}

.header-info {
  padding: 3px 10px;
}

.header-info .subtitle {
  color: #999999;
  font-size: 10.5pt;
  font-weight: 600;
}

.header-info .title {
  color: #d9d9d9;
  font-size: 15pt;
  font-weight: 700;
  font-family: "Roboto Mono", "monospace";
}

/** === Sections === */

.section {
  margin: 0px 9px 12px;
}

.section .name {
  display: block;
  width: 100%;
  color: #999999;
  font-size: 10pt;
  font-weight: 600;
  padding: 0px 2px 7px;
  box-sizing: border-box;
}

.section .content {
  padding: 0px 4px;
}

/** === Blocks === */

.block {
  border: solid 1px #383838;
  border-radius: 2px;
  background: #2b2b2b;
  overflow: hidden;
}

.block .type {
  color: #999999;
  font-size: 10pt;
  font-weight: 600;
  margin-bottom: 1px;
}

.block .text {
  color: #cccccc;
  font-size: 16pt;
  font-weight: 700;
}

.block.padded {
  padding: 10px 12px;
}

.sbs-blocks {
  display: flex;
}

.sbs-blocks .block {
  flex: 1;
}

.sbs-blocks .block:first-child {
  margin-right: 5px;
}
.sbs-blocks .block:last-child {
  margin-left: 5px;
}

hr {
  border-style: solid none none none;
  border-width: 1px;
  border-color: #383838;
}

/** === Classification === */

.classification .class {
  flex: unset;
  padding-right: 20px;
}

.classification .details .text {
  font-size: 10.5pt;
  font-weight: 400;
}  

/** === Breakdown Tables === */

.breakdown-table {
  display: table;
  width: 100%;
  border: solid 1px #383838;
  border-radius: 2px;
}

.breakdown-table .row {
  display: table-row;
}

.breakdown-table .cell {
  display: table-cell;
  color: #cccccc;
  font-size: 10.5pt;
  font-weight: 400;
  padding: 6px 8px;
  border-bottom: solid 1px #383838;
}
.breakdown-table .row:last-child .cell {
  border-bottom: none;
}

.breakdown-table .text {
  width: 100%;
}

.breakdown-table .count {
  min-width: 78px;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
  border-left: solid 1px #383838;
  background: #2b2b2b;
}

.breakdown-table span {
  color: #999999;
}

/** === Time === */

.times .type {
  color: #999999;
  font-size: 10pt;
  font-weight: 600;
  padding: 4px 10px;
  border-bottom: solid 1px #383838;
}

.date-time {
  white-space: nowrap;
  padding: 10px 16px;
  background: #242424;
}

.date-time .date {
  color: #999999;
  font-weight: 600;
  font-size: 10.5pt;
}

.date-time .time {
  color: #cccccc;
  font-weight: 600;
  font-size: 13pt;
}

.duration {
  margin-top: 10px;
}

.duration .text {
  font-size: 12pt;
  font-weight: 600;
}

/** === Code Block === */

.code-block {
  display: inline-block;
  color: #9e9e9e;
  font-size: 10pt;
  font-family: "Roboto Mono", monospace;
  word-break: break-all;
  padding: 3px 6px;
  border: solid 1px #121212;
  border-radius: 3px;
  background: #1f1f1f;
}

</style>
