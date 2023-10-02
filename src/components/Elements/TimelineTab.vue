<template>
  <TabBox class="timeline-tab-element" v-model="active" @close="$emit('close')">
    <Tab class="timeline-tab" name="Timeline">
      <TimelineView class="timeline-view" />
    </Tab>
  </TabBox>
</template>

<script lang="ts">
// Dependencies
import { defineComponent, ref } from "vue";
// Components
import Tab from "@/components/Containers/Tab.vue";
import TabBox from "@/components/Containers/TabBox.vue";
import TimelineView from "@/components/Elements/TimelineView.vue";

export default defineComponent({
  name: "TimelineTab",
  setup() {
    return { active: ref(0) }
  },
  components: { TabBox, Tab, TimelineView }
});
</script>

<style scoped>

/** === Timeline Tab === */

.timeline-tab {
  display: flex;
  flex-direction: column;
}
.timeline-view {
  flex: 1;
}

</style>
