<template>
  <svg width="189" height="189" version="1.1" viewBox="0 0 50.006 50.006" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(-5.4804 -5.2933)">
      <path 
        transform="matrix(.26458 0 0 .26458 5.4804 5.2933)" 
        d="m94.5 0c-52.191-2.2091e-6 -94.5 42.309-94.5 94.5-2.2091e-6 52.191
          42.309 94.5 94.5 94.5 49.624 0 90.285-38.258 94.168-86.883l-16.936-1.4531c-3.1446
          39.917-36.507 71.336-77.232 71.336-42.802 0-77.5-34.698-77.5-77.5
          1e-6 -42.802 34.698-77.5 77.5-77.5 23.974 0 45.387 10.9 59.6
          28h-20.1v17h32 17v-17-32h-17v19.836c-17.322-20.081-42.897-32.836-71.5-32.836zm-8.5
          43v55l44.408 20.709 7.1856-15.408-34.594-16.131v-44.17h-17z" 
        :fill="color"
      />
    </g>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Duration',
  props: {
    color: {
      type: String,
      default: "#999999"
    }
  }
});

</script>
