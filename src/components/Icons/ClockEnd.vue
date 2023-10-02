<template>
  <svg width="325" height="189" version="1.1" viewBox="0 0 85.989 50.006" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-5.4804,-5.2933)">
      <path
        transform="matrix(.26458 0 0 .26458 5.4804 5.2933)" 
        d="m94.5 0a94.5 94.5 0 0 0-94.5 94.5 94.5 94.5 0 0 0 94.5 94.5 94.5
          94.5 0 0 0 94.5-94.5 94.5 94.5 0 0 0-94.5-94.5zm0 17a77.5 77.5 0 0 1
          77.5 77.5 77.5 77.5 0 0 1-77.5 77.5 77.5 77.5 0 0 1-77.5-77.5 77.5
          77.5 0 0 1 77.5-77.5zm-8.5 26v55l44.408 20.709
          7.1856-15.408-34.594-16.131v-44.17h-17z" 
        :fill="color1"
      />
    </g>
    <path
      transform="matrix(0 .34872 -.28762 0 97.276 -25.583)"
      d="m145.06 39.241 39.833 68.993h-39.833-39.833l19.916-34.496z"
      :fill="color2"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ClockEnd',
  props: {
    color1: {
      type: String,
      default: "#999999"
    },
    color2: {
      type: String,
      default: "#737373"
    }
  }
});

</script>
