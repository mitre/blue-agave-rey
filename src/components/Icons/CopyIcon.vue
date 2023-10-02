<template>
  <svg width="9" height="11" version="1.1" viewBox="0 0 9 11" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m2 0v9h7v-9zm1 1h5v7h-5zm-3 1v9h7v-0.94141h-6v-8.0586z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CopyIcon',
  props: {
    color: {
      type: String,
      default: "#a3a3a3"
    }
  }
});

</script>
