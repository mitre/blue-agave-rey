<template>
  <svg width="9" height="12" version="1.1" viewBox="0 0 9 12" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m0 7.3542e-6v5h0.99609v-4.0039h4.0039v3.0039h3.0039v6.0039h-1.0039v0.99609h2v-8.209l-2.791-2.791zm6
        1.2012 1.8008 1.7988h-1.8008zm-2 3.7988-2 2h-2v3h2l2 2zm1 2v3h1v-3z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileIconAudio',
  props: {
    color: {
      type: String,
      default: "#a3a3a3"
    }
  }
});

</script>
