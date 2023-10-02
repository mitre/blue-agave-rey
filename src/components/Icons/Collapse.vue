<template>
  <svg width="9.5192" height="15" version="1.1" viewBox="0 0 2.5186 3.9688" xmlns="http://www.w3.org/2000/svg" :style="style">
    <g transform="translate(-14.886 -6.8475)">
      <path d="m17.405 10.284-1.4501-1.4524 1.4501-1.4524-0.53426-0.53194-1.9844 1.9844 1.9844 1.9844z" :fill="color"/>
    </g>
  </svg>
</template>
  
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Collapse',
  props: {
    color: {
      type: String,
      default: "#999999"
    },
    collapse: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    
    /**
     * Returns the collapse icon's style.
     * @returns
     *  The collapse icon's style.
     */
    style(): { transform: string } {
      return { transform: this.collapse ? "none" : "rotate(-90deg)"}
    }

  }
});

</script>
