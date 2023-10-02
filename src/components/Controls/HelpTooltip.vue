<template>
  <div class="help-tooltip-control">
    <span></span>
    <div :class="['tooltip', direction]" :style="style">
      {{ text }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HelpTooltip',
  props: {
    text: {
      type: String,
      default: ""
    },
    width: {
      type: Number,
      default: 100
    },
    direction: {
      type: String,
      default: "right"
    }
  },
  computed: {
    
    /**
     * Returns the tooltip's style.
     * @returns
     *  The tooltip's style.
     */
    style(): { width: string } {
      return { width: `${ this.width }px`}
    }

  }
});
</script>

<style scoped>

/** === Main Control === */

.help-tooltip-control {
  position: relative;
  font-size: 8pt;
  font-weight: 600;
  user-select: none;
}

.help-tooltip-control:hover .tooltip {
  display: block;
}

/** === Tooltip === */

.tooltip {
  display: none;
  position: absolute;
  top: calc(100% + 12px);
  color: #e5e5e5;
  font-size: 10pt;
  font-weight: 500;
  padding: 10px 11px;
  border-radius: 3px;
  background: #0f0f0f;
  box-shadow: 2px 2px 4px rgb(0 0 0 / 26%);
}

.tooltip.left {
  right: -8px;
}

.tooltip.right {
  left: -8px;
}

.tooltip::before {
  content: "";
  display: block;
  position: absolute;
  top: -4px;
  width: 12px;
  height: 12px;
  background: #0f0f0f;
  transform: rotate(45deg);
}

.tooltip.left::before {
  right: 9px;
}

.tooltip.right::before {
  left: 9px;
}

</style>
