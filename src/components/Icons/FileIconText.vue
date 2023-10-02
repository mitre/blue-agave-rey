<template>
  <svg width="9" height="11" version="1.1" viewBox="0 0 9 11" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="m0 0v11h9v-8.209l-2.791-2.791zm0.99609 0.99609h4.0039v3.0039h3.0039v6.0039h-7.0078zm5.0039 
        0.20508 1.8008 1.7988h-1.8008zm-4 0.79883v1h2v-1zm0 2v1h2v-1zm0 2v1h5v-1zm0 2v1h5v-1z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileIconText',
  props: {
    color: {
      type: String,
      default: "#a3a3a3"
    }
  }
});

</script>
