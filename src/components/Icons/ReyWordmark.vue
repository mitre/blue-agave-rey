<template>
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 487.7 127" xml:space="preserve">
    <path 
      d="M100,0H28H0v28v29v70h28V85h36l36.5,42H128v-11.1l-26.9-31C116,84.4,128,
        72,128,57V28C128,12.6,115.4,0,100,0z M100,57H28 V28h72V57z"
      :fill="color"  
    />
    <polygon
      points="148,0 148,28 148,49.5 148,77.5 148,99 148,127 176,127 266,
        127 266,99 176,99 176,77.5 248,77.5 248,49.5 176,49.5 176,28 266,28 266,0 176,0"
      :fill="color"
    />
    <polygon 
      points="386.9,0 349,50.3 311.1,0 276,0 276,0 335,78.3 335,127 363,127 363,78.3 422,0 422,0"
      :fill="color"
    />
    <polygon 
      points="479.8,0 473.4,17.3 466.9,0 459.1,0 459.1,26.1 465.6,26.1 465.6,
        11.4 471.5,26.1 475.2,26.1 481.1,11.4 481.1,26.1 487.7,26.1 487.7,0"
      :fill="color"
    />
    <polygon 
      points="432,5.4 440,5.4 440,26.1 446.6,26.1 446.6,5.4 454.5,5.4 454.5,0 432,0"
      :fill="color"
    />
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ReyWordmark',
  props: {
    color: {
      type: String,
      default: "#999999"
    }
  }
});

</script>
