<template>
  <div :class="['dropdown-filter-items-control', orientation]">
    <li class="view-all" @click="$emit('select', '__all_lanes', true)">
      <p class="check" v-show="inViewAllState">✓</p>
      <p class="text">View All</p>
    </li>
    <ScrollBox>
      <div class="filters">
        <li 
          v-for="filter of filters" :key="filter.id.toString()"
          @click="select(filter)"
        >
          <p class="check" v-show="!inViewAllState && filter.value">✓</p>
          <p class="text">{{ filter.text }}</p>
        </li>
        <li v-if="!filters.length" class="no-filters">No Filters</li>
      </div>
    </ScrollBox>
  </div>
</template>

<script lang="ts">
// Dependencies
import { defineComponent, type PropType } from 'vue';
import type { Primitive } from '@/assets/scripts/HelperTypes';
// Components
import ScrollBox from "@/components/Containers/ScrollBox.vue";

export default defineComponent({
  name: 'DropdownFilterItems',
  props: {
    filters: {
      type: Array as PropType<{ id: Primitive, text: string, value: boolean }[]>,
      required: true
    }
  },
  data() {
    return {
      orientation: [] as string[]
    }
  },
  computed: {

    /**
     * Returns true if all lanes are visible, false otherwise.
     * @returns
     *  True if all lanes are visible, false otherwise.
     */
    inViewAllState(): boolean {
      for(let filter of this.filters) {
        if(!filter.value) return false;
      }
      return true;
    }

  },
  emits: ["select"],
  methods: {

    /**
     * Filter selection behavior.
     * @param filter
     *  The selected filter. 
     */
    select(filter: { id: Primitive, text: string, value: boolean }) {
      // If in "view all" state, hide everything except selection
      if(this.inViewAllState) {
        for(let f of this.filters) {
          if(f.id === filter.id) continue;
          this.$emit("select", f.id, !f.value);
        }
      }
      // If not in "view all" state, only hide selection 
      else {
        this.$emit("select", filter.id, !filter.value);
      }
    }

  },
  mounted() {
    // Calculate viewport parameters
    let { bottom, right } = this.$el.getBoundingClientRect();
    let viewWidth  = window.innerWidth;
    let viewHeight = window.innerHeight;
    // Offset vertically
    if(bottom > viewHeight) {
      this.orientation.push("above");
    } else {
      this.orientation.push("below");
    }
    // Offset horizontally
    if(right > viewWidth) {
      this.orientation.push("right");
    } else {
      this.orientation.push("left");
    }
  },
  components: { ScrollBox }
});
</script>

<style scoped>
  
/** === Main Control === */

.dropdown-filter-items-control {
  position: absolute;
  display: flex;
  flex-direction: column;
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

.dropdown-filter-items-control.above {
  bottom: 100%;
  border-top-left-radius: 3px;
  border-top-right-radius: 3px;
  box-shadow: 2px -2px 4px rgb(0 0 0 / 26%);
}
.dropdown-filter-items-control.below {
  top: 100%;
  border-bottom-left-radius: 3px;
  border-bottom-right-radius: 3px;
  box-shadow: 2px 2px 4px rgb(0 0 0 / 26%);
}

.dropdown-filter-items-control.left {
  left: 0px;
}
.dropdown-filter-items-control.right {
  right: 0px;
}

.scroll-box {
  flex: 1;
}

.filters {
  padding: 6px 5px;
}

/** === Filters === */

li {
  position: relative;
  display: flex;
  padding: 4px 23px;
  list-style: none;
  user-select: none;
}
li:hover {
  color: #fff;
  background: #f95939;
}

.check {
  position: absolute;
  left: 5px;
}

li.view-all {
  padding: 6px 28px;
  background: #2b2b2b;
}
li.view-all:hover {
  color: #e6e6e6;
  background: #383838;
} 
li.view-all .check {
  left: 10px;
}

/** === No Filters === */

.no-filters { 
  color: #a6a6a6;
  text-align: center;
  font-style: italic;
}
.no-filters:hover {
  color: #a6a6a6;
  background: none;
}

</style>
