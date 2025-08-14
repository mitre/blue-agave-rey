<template>
    <TabBox class="tool-tabs-element" v-model="active" :canClose="canClose" @close="$emit('close')">
      <Tab name="Search" class="tab">
        <Search></Search>
      </Tab>
    </TabBox>
  </template>
  
  <script lang="ts">
  // Dependencies
  import { defineComponent } from "vue";
  // Components
  import Tab from "@/components/Containers/Tab.vue";
  import TabBox from "@/components/Containers/TabBox.vue";
  import Search from "@/components/Elements/Search.vue";
  
  export default defineComponent({
    name: "ToolTabs",
    props: {
      canClose: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        active: 0
      }
    },
    computed: {

    },
    emits: ["close"],
    components: { Tab, TabBox, Search }
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
  