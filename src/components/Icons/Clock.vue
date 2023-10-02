<template>
  <svg width="189" height="189" version="1.1" viewBox="0 0 50.006 50.006" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-5.4804 -5.2933)">
      <path
        transform="matrix(.26458 0 0 .26458 5.4804 5.2933)" 
        d="m94.5 0a94.5 94.5 0 0 0-94.5 94.5 94.5 94.5 0 0 0 94.5 94.5 94.5
          94.5 0 0 0 94.5-94.5 94.5 94.5 0 0 0-94.5-94.5zm0 17a77.5 77.5 0 0 1
          77.5 77.5 77.5 77.5 0 0 1-77.5 77.5 77.5 77.5 0 0 1-77.5-77.5 77.5
          77.5 0 0 1 77.5-77.5zm-8.5 26v55l44.408 20.709 
          7.1856-15.408-34.594-16.131v-44.17h-17z" 
        :fill="color"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Clock',
  props: {
    color: {
      type: String,
      default: "#999999"
    }
  }
});

</script>
