<template>
  <ScrollBox :style="style" :class="['dropdown-items-control', orientation]">
    <div class="options">
      <li 
        v-for="option of options" :key="option.id.toString()"
        :class="{ focused: hoveredId === option.id }"
        @mouseenter="hoveredId = option.id"
        @click="select(option)"
      >
        {{ option.text }}
      </li>
      <li v-if="!options.length" class="no-options">No {{ type }}s</li>
    </div>
  </ScrollBox>
</template>

<script lang="ts">
// Dependencies
import { defineComponent, inject, type PropType } from 'vue';
import type { Primitive } from '@/assets/scripts/HelperTypes';
// Components
import ScrollBox from "@/components/Containers/ScrollBox.vue";

export default defineComponent({
  name: 'DropdownItems',
  setup() {
    
    // Import dropdown state
    type DropdownState = { itemsShown: boolean } | undefined;
    let dropdownState: DropdownState = inject("dropdownState");
    
    // Load dropdown state
    if(dropdownState === undefined) {
      throw new TypeError(
        "<DropdownItems> can only be used within a <DropdownMenu>."
      );
    }
    return { ...dropdownState }
  
  },
  props: {
    type: {
      type: String,
      default: "Option"
    },
    options: {
      type: Array as PropType<{ id: Primitive, text: string }[]>,
      required: true
    },
    selected: {
      type: String as PropType<string | null>,
      default: null
    }
  },
  data() {
    return { 
      style: { top: "100%", left: "0px" } as { 
        top?: string, 
        left?: string, 
        bottom?: string, 
        right?: string
      },
      hoveredId: this.selected as Primitive | null,
      orientation: [] as string[]
    }
  },
  emits: ["select"],
  methods: {

    /**
     * Option selection behavior.
     * @param option
     *  The selected option.
     */
    select(option: { id: Primitive, text: string }) {
      this.$emit("select", option);
      this.itemsShown = false;
    }

  },
  mounted() {
    // Calculate viewport parameters
    let { bottom, right } = this.$el.getBoundingClientRect();
    let viewWidth  = window.innerWidth;
    let viewHeight = window.innerHeight;
    // Clear style
    this.style = {};
    // Offset vertically
    if(viewHeight < bottom) {
      this.style.bottom = "100%";
      this.orientation.push("above");
    } else {
      this.style.top = "100%";
      this.orientation.push("below");
    }
    // Offset horizontally
    if(viewWidth < right) {
      this.style.right = "0px";
      this.orientation.push("right");
    } else {
      this.style.left = "0px";
      this.orientation.push("left");
    }
  },
  components: { ScrollBox }
});
</script>

<style scoped>

/** === Main Control === */

.dropdown-items-control {
  position: absolute;
  width: max-content;
  min-width: 100%;
  color: #b8b8b8;
  font-size: 9.5pt;
  font-weight: 400;
  border: solid 1px #383838;
  box-sizing: border-box;
  background: #1f1f1f;
  overflow: hidden;
  z-index: 99;
}

.dropdown-items-control.above {
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  box-shadow: 2px -2px 4px rgb(0 0 0 / 26%);
}
.dropdown-items-control.below {
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  box-shadow: 2px 2px 4px rgb(0 0 0 / 26%);
}
.dropdown-items-control.left {
  text-align: left;
}
.dropdown-items-control.right {
  text-align: right;
}

.options {
  padding: 6px 5px;
}

/** === Options === */

li {
  padding: 5px 12px;
  list-style: none;
  user-select: none;
}
li.focused {
  color: #fff;
  background: #f95939;
}

/** === No Options === */

.no-options { 
  color: #a6a6a6;
  text-align: center;
  font-style: italic;
}

</style>
