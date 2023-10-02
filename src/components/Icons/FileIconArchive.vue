<template>
  <svg width="9" height="11" version="1.1" viewBox="0 0 9 11" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m0 3.6771e-5v11h9v-8.209l-2.791-2.791h-6.209zm0.99609 0.99609h4.0039v3.0039h3.0039v6.0039h-7.0078zm5.0039 
        0.20508 1.8008 1.7988h-1.8008zm-4 0.79883v2h1v1h1v-3zm1 3h-1v1h1zm0 1v1h1v-1zm0 1h-1v1h1zm0 1v1h1v-1z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileIconArchive',
  props: {
    color: {
      type: String,
      default: "#a3a3a3"
    }
  }
});

</script>
