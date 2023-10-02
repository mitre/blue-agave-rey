<template>
  <div class="checklist-loader-icon" :style="cssProps">
    <li v-for="(e, i) in elements" :key="i" :style="{ animationDelay: `${ i*100 }ms` }">
      <div class="checkbox"></div>
      <div class="fill-text" :style="{ width: getRandomSize(70, 120) }"></div>
    </li>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ChecklistLoader",
  props: {
    elements: {
      type: Number,
      default: 3
    },
    color: {
      type: String,
      default: "#ffffff"
    }
  },
  computed: {

    /**
     * Returns the loader's CSS properties.
     */
    cssProps() {
      return {
        "--loader-color": this.color,
      }
    }

  },
  methods: {

    /**
     * Returns a random size within the specified range.
     * @param min
     *  The range's minimum. (inclusive)
     * @param max
     *  The range's maximum. (exclusive)
     * @return
     *  A random size within the specified range.
     */
    getRandomSize(min: number, max: number): string {
      return `${ min + Math.floor(Math.random() * (max - min)) }px`
    }

  }
});
</script>

<style scoped>

/** === Main Icon === */

li {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  border: solid 1px var(--loader-color);
  border-radius: 3px;
  margin-bottom: 3px;
  box-sizing: border-box;
  list-style-type: none;
  opacity: 0.05;
  animation: pulse-fade 1.6s infinite;
}

li .checkbox {
  width: 24px;
  border-right: solid 1px var(--loader-color);
  margin-right: 8px;
}

li .fill-text {
  height: 8px;
  border-radius: 2px;
  margin: 8px 0px;
  background: var(--loader-color);
}

@keyframes pulse-fade {
  0%   { opacity: 0.06; }
  50%  { opacity: 0.19; }
  100% { opacity: 0.06; }
}

</style>
