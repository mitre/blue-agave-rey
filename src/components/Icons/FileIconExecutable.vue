<template>
  <svg width="11" height="11" version="1.1" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m0 0v11h11v-11h-11zm1 2h9v8h-9v-8zm1 1v6h4v-6h-4zm5 0v2h2v-2h-2zm-4 1h2v4h-2v-4zm4 2v1h2v-1h-2zm0 2v1h2v-1h-2z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileIconExecutable',
  props: {
    color: {
      type: String,
      default: "#a3a3a3"
    }
  }
});

</script>
