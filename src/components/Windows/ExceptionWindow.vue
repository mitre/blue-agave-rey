<template>
  <Window 
    class="exception-window" 
    title="Rey Exception"
    v-slot="{ exception }"
    @close="onClose"
    @grab="onGrab"
  >
    <div class="exception-information">
      <div class="exception">
        <p class="warning-icon">⚠</p>
        <div class="text">
          <p class="title">{{ exception.title }}</p>
          <p class="message">{{ exception.message }}</p>
        </div>
      </div>
      <div class="exception-data">
        <ScrollBox class="scrollbox">
          <p class="json">{{ JSON.stringify(exception, null, 2) }}</p>
        </ScrollBox>
      </div>
      <button class="okay" @click="this.$emit('close')">OK</button>
    </div>
  </Window>
</template>

<script lang="ts">
// Dependencies
import { defineComponent } from "vue";
// Components
import Window from "@/components/Containers/Window.vue";
import ScrollBox from "@/components/Containers/ScrollBox.vue";

export default defineComponent({
  name: "ExceptionWindow",
  emits: ["grab", "close"],
  methods: {
    
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
    }

  },
  components: { Window, ScrollBox }
});
</script>

<style scoped>

/** === Main Window === */

.exception-window {
  min-width: 500px;
  max-width: 680px;
}

.exception-information {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 20px 30px 14px;
}

/** === Exception Info === */

.exception {
  display: flex;
  width: 100%;
}

.warning-icon {
  color: #d6b03d;
  font-size: 27pt;
  margin: 5px 15px 0px 5px;
  user-select: none;
}

.text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  color: #bfbfbf;
  font-size: 13pt;
  font-weight: 700;
}

.message {
  color: #b3b3b3;
  font-size: 10pt;
  font-weight: 500;
  margin-top: 4px;
}

/** === Exception Data === */

.exception-data {
  width: 100%;
  border: solid 1px #3d3d3d;
  border-radius: 5px;
  margin: 20px 0px 14px;
  background: #232323;
}

.scrollbox {
  max-height: 250px;
  border: solid 1px #0d0d0d;
  border-radius: 5px;
  box-sizing: border-box;
}

.json {
  color: #a8a8a8;
  font-size: 8.5pt;
  font-family: "Roboto Mono", monospace;
  line-height: 12pt;
  white-space: pre-wrap;
  padding: 12px 15px;
}

/** === Okay Button === */

.okay {
  width: 90px;
  height: 28px;
}

</style>
