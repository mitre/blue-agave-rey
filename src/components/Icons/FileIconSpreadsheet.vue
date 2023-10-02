<template>
  <svg width="11" height="11" version="1.1" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m0 0v0.5 10.5h11v-8.207l-2.793-2.793h-8.207zm1 1h6v2 1h1 2v6h-9v-9zm7
        0.20703 1.793 1.793h-1.793v-1.793zm-6 0.79297v1 1 1 1 1 1 1h1 2 1 2 1v-1-3h-1v1h-2v-4h-3-1zm1
        1h2v1h-2v-1zm0 2h2v1h-2v-1zm0 2h2v1h-2v-1zm3 0h2v1h-2v-1z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileIconSpreadsheet',
  props: {
    color: {
      type: String,
      default: "#a3a3a3"
    }
  }
});

</script>
