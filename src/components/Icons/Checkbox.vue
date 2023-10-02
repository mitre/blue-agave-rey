<template>
  <div v-if="!checked" 
    :style="`width:10px;height:10px;border-radius:2px;border:solid 1px${ color };`"
  ></div>
  <svg v-else 
    width="12" 
    height="12"
    version="1.1"
    viewBox="0 0 3.1750423 3.1750122"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg"
  >
    <path
      x="-3.0427508" 
      y="0.1322915"
      width="2.9104593" 
      height="2.910429" 
      style="fill:#f95939;stroke:#f95939;stroke-width:0.264583;" 
      d="m -2.7781675,0.1322915 h 2.38129261 a 0.26458333,0.26458333 45 0 1 0.26458333,0.26458333 
        V 2.7781372 A 0.26458333,0.26458333 135 0 1 -0.39687489,3.0427205 H -2.7781675 
        A 0.26458333,0.26458333 45 0 1 -3.0427508,2.7781372 V 0.39687483 
        A 0.26458333,0.26458333 135 0 1 -2.7781675,0.1322915 Z"
      transform="scale(-1,1)"
    />
    <path 
      style="fill:#ffffff" 
      d="M 0.42846582,1.6523365 1.2684427,2.482166 2.7465766,1.0119245 
        2.4263706,0.69284607 1.2684427,1.846264 0.74641681,1.333258 Z"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

/**
 * Developer's Note:
 * Inkscape sucks at producing shapes with a 1-pixel border, just going to use
 * a simple <div> for the unchecked box.
 */

export default defineComponent({
  name: 'Checkbox',
  props: {
    checked: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: "#666666"
    }
  }
});
</script>
