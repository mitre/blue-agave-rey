<template>
  <div class="labeled-checkbox-control" @click="$emit('change', !checked)">
    <div class="checkbox-region">
      <Checkbox class="checkbox" :checked="checked" />
      <div class="label">{{ text }}</div>
    </div>
  </div>
</template>

<script lang="ts">
// Dependencies
import { defineComponent } from 'vue';
// Components
import Checkbox from "@/components/Icons/Checkbox.vue";

export default defineComponent({
  name: 'LabeledCheckbox',
  props: {
    text: {
      type: String,
      default: ""
    },
    checked: {
      type: Boolean,
      default: false
    }
  },
  emits: ["change"],
  components: { Checkbox }
});
</script>

<style scoped>

/** === Main Control === */

.labeled-checkbox-control {
  display: flex;
  align-items: center;
  font-size: 9.5pt;
  font-weight: 500;
  user-select: none;
}

.checkbox-region {
  display: flex;
  align-items: center;
  padding: 0px 10px;
}

.checkbox {
  width: 12px;
  height: 12px;
  margin-right: 8px;
}

</style>
