<template>
  <svg width="14px" height="14px" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2,12h10V5H2V12z M9,6h2v1H9V6z M9,8h2v1H9V8z M9,10h2v1H9V10z M6,
        6h2v1H6V6z M6,8h2v1H6V8z M6,10h2v1H6V10z M3,6h2v1H3V6z M3,
        8h2v1H3V8z M3,10h2v1H3V10z M13,1h-2V0H8v1H6V0H3v1H1C0.448,1,0,1.448,0,
        2v11c0,0.553,0.448,1,1,1h12c0.553,0,1-0.447,1-1V2C14,1.448,13.553,1,13,
        1z M9,2h1v1H9V2z M4,2h1v1H4V2z M13,13H1V2h2v2h3V2h2v2h3V2h2V13z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Calendar',
  props: {
    color: {
      type: String,
      default: "#999999"
    }
  }
});

</script>
