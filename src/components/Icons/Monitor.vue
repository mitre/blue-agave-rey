<template>
  <svg width="14.004" height="14" version="1.1" viewBox="0 0 3.7052 3.7042" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m0 0v2.9099h3.7052v-2.9099zm0.26355 0.26355h3.176v2.3828h-3.176zm0.26562 0.26562
         v1.8516h2.6469v-1.8516zm0.26355 0.26355h2.1172v1.3245h-2.1172zm0.79478 2.3823
         v0.26458h-0.79375v0.26458h2.1167v-0.26458h-0.79375v-0.26458z"
      :fill="color"
    />
  </svg>
</template>
    
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
name: 'Monitor',
props: {
    color: {
    type: String,
    default: "#999999"
    }
}
});

</script>
