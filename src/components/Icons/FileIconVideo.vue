<template>
  <svg width="11" height="11" version="1.1" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m0 0v0.5 10.5h11v-8.207l-2.793-2.793h-8.207zm1 1h6v2 1h1 2v6h-9v-9zm7
        0.20703 1.793 1.793h-1.793v-1.793zm-6 0.79297v1h1v-1h-1zm2 0v2h2v-2h-2zm-2 
        2v1h1v-1h-1zm2 1v2h3v-2h-3zm-2 1v1h1v-1h-1zm6 0v1h1v-1h-1zm-6 2v1h1v-1h-1zm2 
        0v1h3v-1h-3zm4 0v1h1v-1h-1z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileIconVideo',
  props: {
    color: {
      type: String,
      default: "#a3a3a3"
    }
  }
});

</script>
