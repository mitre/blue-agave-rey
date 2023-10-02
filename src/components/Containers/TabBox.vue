<template>
  <div class="tab-box-container">
    <div class="tab-box-header">
      <li 
        v-for="(tab, i) in tabs" :key="i" 
        :class="['tab-link', { active: active === i }]"
        @click="select(i)"
      >
        <p>{{ tab.props.name }}</p>
      </li>
      <li class="close-link" v-if="canClose" @click="$emit('close')">✗</li>
    </div>
    <div class="tab-box-body">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, provide, computed, defineComponent } from "vue";

export default defineComponent({
  name: "TabBox",
  setup(props, { emit }) {

    // Create reactive state properties
    let active = computed(() => props.modelValue);
    let tabs = ref([]);

    // Provide them to descendants
    provide("tabsState", { active, tabs });
    
    // Define tab selection function
    function select(tab: number) {
      emit("update:modelValue", tab);
    }
    
    // Return properties
    return { active, tabs, select }
  
  },
  props: {
    canClose: {
      type: Boolean,
      default: true,
    },
    modelValue: {
      type: [String, Number],
    },
  },
  emits: ["update:modelValue", "close"],
});
</script>

<style scoped>

/** === Main Container === */

.tab-box-container {
  display: flex;
  flex-direction: column;
  border: solid 1px #0f0f0f;
}
.tab-box-header {
  width: 100%;
  height: 22px;
  border-bottom: solid 1px #0f0f0f;
  background: #2b2b2b;
}

/** === Tab Link === */

.tab-link {
  height: 100%;
  color: #8c8c8c;
  font-size: 8.7pt;
  text-align: center;
  line-height: 22px;
  font-weight: 500;
  padding: 0px 12px 1px;
  list-style-type: none;
  user-select: none;
  cursor: pointer;
  float: left;
}

.tab-link:not(.active):hover {
  color: #c2c2c2;
}

.tab-link.active {
  color: #d9d9d9;
  border-left: solid 1px #0f0f0f;
  border-right: solid 1px #0f0f0f;
  background: #212121;
}
.tab-link.active:first-child {
  border-left: none;
}

.tab-link p {
  display: flex;
  align-items: center;
}

/** === Close Link === */

.close-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 22px;
  color: #bfbfbf;
  font-family: "Inter", sans-serif;
  font-size: 11pt;
  font-weight: 400;
  margin-right: 2px;
  user-select: none;
  cursor: pointer;
  float: right;
}
.close-link:hover {
  color: #fff;
}

/** === Tab Body === */

.tab-box-body {
  /** 23px -> 22px header + 1px bottom-border */
  height: calc(100% - 23px);
  background: #212121;
}

</style>
