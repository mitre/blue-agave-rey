<template>
  <svg width="11" height="11" version="1.1" viewBox="0 0 11 11" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="m0 0v11h11v-11zm1 1h9v9h-9zm2 2v2h2v-2zm4.4902 1.8789c-0.027281 1.655e-4
        -0.054557 2.645e-4 -0.082031 0.00195-0.3741 0.023509-0.70928 0.18707-0.89648
        0.4375l-1.7617 2.3477-0.26172-0.34766c-0.43943-0.58539-1.5371-0.58539-1.9766
        0l-0.51172 0.68164v1h7v-3l-0.23828-0.31836-0.27344-0.36328c-0.20626-0.27581-0.58884-0.44193-0.99805-0.43945z"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FileIconImage',
  props: {
    color: {
      type: String,
      default: "#a3a3a3"
    }
  }
});

</script>
