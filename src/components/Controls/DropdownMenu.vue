<template>
  <FocusBox 
    :class="['dropdown-menu-control', type, { active: itemsShown }]"
    @unfocus="itemsShown=false"
    @click="itemsShown=true"
  >
    <div class="textbox">
      <p class="pre-text" v-if="pretext">{{pretext}}</p>
      {{ pretext && text ? '&nbsp;' : '' }}
      <p class="text" v-if="text">{{text}}</p>
      <p class="arrow">▼</p>
    </div>
    <div v-if="itemsShown" @click.stop>
      <slot></slot>
    </div>
  </FocusBox>
</template>

<script lang="ts">
// Dependencies
import { defineComponent, provide, ref } from 'vue';
// Components
import FocusBox from "@/components/Containers/FocusBox.vue";

export default defineComponent({
  name: 'DropdownMenu',
  setup() {
    // Create itemsShown state property
    let itemsShown = ref(false);
    // Provide state to descendants
    provide("dropdownState", { itemsShown });
    // Return itemsShown
    return { itemsShown }
  },
  props: {
    type: {
      type: String,
      default: "standard"
    },
    pretext: {
      type: String,
      default: ""
    },
    text: {
      type: String,
      default: ""
    }
  },
  components: { FocusBox }
});
</script>

<style scoped>

/** === Main Control === */

.dropdown-menu-control {
  position: relative;
  display: flex;
  align-items: center;
}

/** === Micro-Type Dropdown === */

.micro {
  font-size: 9.5pt;
  font-weight: 500;
}
.micro .text {
  font-weight: 600;
}

/** === Text === */

.textbox {
  display: flex;
  align-items: center;
  padding: 0px 10px;
}
.text {
  color: #ef684d;
}
.arrow {
  font-size: 5.5pt;
  margin-left: 8px;
}

</style>
