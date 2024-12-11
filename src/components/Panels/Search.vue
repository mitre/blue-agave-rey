<template>
  <div class="activity-set-search-panel" @contextmenu.stop>
    <SearchField id="search-field" @search="onSearch"></SearchField>
    {{ queryString }}
  </div>
</template>

<script lang="ts">
// Dependencies
import { defineComponent, type PropType } from "vue";
// Components
import SearchField from "@/components/Controls/SearchField.vue";

export default defineComponent({
  name: "Search",
  data() {
    return {
      queryString: "",
    }
  },
  computed: {
    

  },
  methods: {

    /**
     * Performs a search.
     * @param queryString
     *  The query string. 
     */
    onSearch(queryString: string) {
      this.queryString = queryString;
    }

  },
  components: { SearchField }
});

type BreakdownItem = {
  text: string,
  amount: number,
  percent: number
}

</script>

<style scoped>

/** === Main Panel === */

.activity-set-search-panel {
  padding: 15px 12px;
}

/** === Body === */

.search-panel {
  width: 100%;
}

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
