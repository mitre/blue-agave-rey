<template>
  <div class="window-container">
    <div class="window-header">
      <div class="drag-bar" @pointerdown="$emit('grab', $event)">
        <div class="window-title">{{ title }}</div>
      </div>
      <div class="close-icon" v-if="canClose" @click="$emit('close')">✗</div>
    </div>
    <div class="window-body">
      <slot v-bind="data"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "Window",
  props: {
    title: {
      type: String,
      default: "Rey",
    },
    data: {
      data: Object,
      default: {}
    },
    canClose: {
      data: Boolean,
      default: true
    }
  },
  emits: ["grab", "close"],
});
</script>

<style scoped>

/** === Main Container === */

.window-container {
  display: flex;
  flex-direction: column;
  border: solid 1px #0f0f0f;
  border-radius: 4px;
  background: #2b2b2b;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

/** === Window Header === */

.window-header {
  display: flex;
  align-items: center;
  height: 26px;
  border-bottom: solid 1px #0f0f0f;
  background: #212121;
}

.drag-bar {
  display: flex;
  align-items: center;
  flex: 1;
  height: 100%;
}

.window-title {
  color: #8a8a8a;
  font-size: 10pt;
  font-weight: 700;
  padding: 0px 12px;
  user-select: none;
  pointer-events: none;
}

.close-icon {
  display: flex;
  align-items: center;
  height: 100%;
  color: #9e9e9e;
  font-weight: 500;
  padding: 0px 8px;
  user-select: none;
  transition: 0.05s all;
}
.close-icon:hover {
  background: #f33f3f;
  color: #f2f2f2;
}

/** === Window Body === */

.window-body {
  flex: 1;
}

</style>
