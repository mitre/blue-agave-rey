<template>
  <svg 
    :width="size"
    :height="size"
    :stroke="color"
    :viewBox="`0 0 ${size} ${size}`"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle 
      fill="none"
      fill-rule="evenodd"
      stroke-width="4"
      :cx="size / 2"
      :cy="size / 2"
      :r="radius"
      :style="style"
    >
      <animateTransform 
        attributeName="transform" 
        attributeType="XML" 
        type="rotate"
        dur="1s"
        :from="`0 ${size/2} ${size/2}`"
        :to="`360 ${size/2} ${size/2}`" 
        repeatCount="indefinite"
      />
    </circle>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SpinLoader',
  props: {
    color: {
      type: String,
      default: "#999999"
    },
    size: {
      type: Number,
      default: 100
    },
    length: {
      type: Number,
      default: 3 * Math.PI / 2
    }
  },
  computed: {
    radius() {
      return (this.size / 2) - 5;
    },
    style() {
      return { strokeDasharray: this.radius * this.length }
    }
  }
});

</script>
