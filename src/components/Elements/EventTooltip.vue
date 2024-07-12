<template>
  <div :class="['event-tooltip-element', tooltip.orientation]" :style="{ ...tooltip.style, left }">
    <!-- "More Items" Item -->
    <div class="more-items" v-if="tooltip.items.length !== items.length">
      <span class="color"></span>
      <p>+{{ items.length - tooltip.items.length }} More Items</p>
    </div>
    <!-- Items List -->
    <div class="events">
      <!-- Item Info Column -->
      <div class="infos">
        <div
          class="info"
          :style="{ height: `${ itemHeight }px` }"
          v-for="item of tooltipItems" :key="item.id"
          @click="onItemClick(item.id)"
        >
          <span class="color" :style="{ background: item.color }"></span>
          <div class="info-text">
            <p class="title">{{ item.title }}</p>
            <p class="subtitle">{{ item.subtitle }}</p>
          </div>
          <span class="select-dot" 
            :class="{ on: item.selectColor !== 'none' }"
            :style="{ background: item.selectColor }"
          ></span>
        </div>
      </div>
      <!-- Item Timestamp Column -->
      <div class="timestamps">
        <div 
          class="timestamp" 
          :style="{ height: `${ itemHeight }px` }"
          v-for="item of tooltipItems" :key="item.id"
        >
          <p class="date">{{ item.date }}</p>
          <p class="time">
            <span class="major-time">
              {{ item.time.hour }}:{{ item.time.min }}:{{ item.time.sec }}
            </span>
            <span class="meridiem" v-if="item.time.meridiem">
              &nbsp;{{ item.time.meridiem }}
            </span>
            <span class="minor-time">
              &nbsp;(.{{ item.time.ms }})
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
import { ColorMap } from '@/assets/scripts/Visualizations/VisualAttributeValues';
import { titleCase } from "@/assets/scripts/String";
import { GenericViewItem } from '@/assets/scripts/Visualizations/ViewBaseTypes/GenericViewItem';
import { mapActions, mapState } from 'vuex';
import { defineComponent, type PropType } from 'vue';
import { formatDateCal, formatTime } from '@/assets/scripts/Visualizations/Time';
import { 
  FillColorMask,
  Stroke2ColorMask
} from '@/assets/scripts/Visualizations/VisualAttributes';
import { 
  ActivitySetEventNode, 
  type ActivitySetCommonNode,
  ActivitySetAnalyticNode 
} from '@/assets/scripts/ViewData/ViewNode';

/**
 * Developer's Note:
 * This tooltip updates its display parameters any time one of its
 * display-related props changes. It is not currently designed to *actively*
 * handle the resizing of its parent container. If the tooltip is displayed
 * *while* its parent is being resized, the tooltip will not update. The
 * tooltip is (currently) only meant to be displayed while hovering over an
 * item.
 */

export default defineComponent({
  name: 'EventTooltip',
  props: {
    items: {
      type: Array as PropType<ActivitySetCommonNode[]>,
      default: []
    },
    objectRegion:{
      type: Object as PropType<{
        top: number,
        left: number,
        right: number,
        bottom: number
      }>,
      required: true
    },
    itemHeight: {
      type: Number,
      default: 52
    },
    leftOffset: {
      type: Number,
      default: 12,
    },
    basePadding: {
      type: Number,
      default: 6
    },
    windowPadding: {
      type: Number,
      default: 80
    }
  },
  data() {
    return {
      left: "0px",
      parent: null as HTMLElement | null
    }
  },
  computed: {

    /**
     * Activity Sets Store data
     */
    ...mapState<any, {
      selected: (state: Store.ActivitySetsStore) => Map<string, GenericViewItem>
    }>("ActivitySetsStore", {
      selected(state: Store.ActivitySetsStore): Map<string, GenericViewItem> {
        return state.selected;
      }
    }),

    /**
     * App Settings Store data
     */
    ...mapState<any, {
      display24HourTime: (state: Store.AppSettingsStore) => boolean,
      multiSelectHotkey: (state: Store.AppSettingsStore) => { hotkey: string, strict: boolean },
      tracebackHotKey: (state: Store.AppSettingsStore) => { hotkey: string, strict: boolean }
    }>("AppSettingsStore", {
      display24HourTime(state: Store.AppSettingsStore): boolean {
        return state.settings.view.app.display_24_hour_time;
      },
      multiSelectHotkey(state: Store.AppSettingsStore) {
        return {
          hotkey: state.settings.keybindings.selection.multi_select,
          strict: false,
        };
      },
      tracebackHotKey(state: Store.AppSettingsStore) {
        return {
          hotkey: state.settings.keybindings.selection.traceback,
          strict: false,
        };
      }
    }),

    /**
     * Returns the formatted tooltip items. 
     * @returns
     *  The formatted tooltip items.
     */
    tooltipItems() {
      let items = new Array(this.tooltip.items.length);
      for(let i = 0; i < items.length; i++) {
        items[i] = {
          id: this.tooltip.items[i].id,
          date: formatDateCal(this.tooltip.items[i].time),
          time: formatTime(this.tooltip.items[i].time, this.display24HourTime),
          color: this.getColor(this.tooltip.items[i]),
          title: this.formatTitle(this.tooltip.items[i]),
          subtitle: this.formatSubtitle(this.tooltip.items[i]),
          selectColor: this.getSelectedColor(this.tooltip.items[i]) 
        }
      }
      return items;
    },

    /**
     * Returns the tooltip's display parameters.
     * @returns
     *  The tooltip's display parameters.
     *  [items]
     *   The tooltip's items.
     *  [style]
     *   The tooltip's CSS styling.
     *  [orientation]
     *   The tooltip's orientation class.
     */
    tooltip() {
      let items, style, orientation;
      if(this.$el === null) {
        items = this.items;
        style = { top: "0px" };
        orientation = "above";
      } else {
        let or = this.objectRegion;
      
        // Compute the parent's position within the window
        let parent = this.parent!.getBoundingClientRect();
        let parentHeight = parent.bottom - parent.top;
        
        // Calculate vertical padding required (+2 for 1px border)
        let padding = this.basePadding + this.windowPadding + 2;
        
        // Calculate available vertical space above and below
        let viewHeight = window.innerHeight;
        let vsAbove = parent.top + or.top - padding;
        let vsBelow = viewHeight - parent.top - or.bottom - padding;
        let itemsAbove = Math.floor(vsAbove / this.itemHeight);
        let itemsBelow = Math.floor(vsBelow / this.itemHeight);
        
        // If above can fit more items, force fit above region
        if(itemsBelow <= itemsAbove) {
          // If all items can't fit, -1 item for the "More Events" item
          if(itemsAbove < this.items.length)
            itemsAbove = Math.max(0, itemsAbove - 1);
          items = this.items.slice(-itemsAbove);
          style = { bottom: `${ parentHeight - this.objectRegion.top }px` }
          orientation = "above";
        }
        
        // If below can fit more items, force fit below region
        else {
          // If all items can't fit, -1 item for the "More Events" item
          if(itemsBelow < this.items.length)
            itemsBelow = Math.max(0, itemsBelow - 1);
          items = this.items.slice(-itemsBelow);
          style = { top: `${ this.objectRegion.bottom }px` };
          orientation = "below";
        }

        // Update left offset after this update applies
        this.$nextTick(() => this.updateLeftOffset(parent));

      }

      // Return display parameters
      return {
        items, 
        style: { ...style, padding: `${ this.basePadding }px 0px`, },
        orientation
      }

    }

  },
  methods: {

    /**
     * Activity Sets Store actions
     */
    ...mapActions("ActivitySetsStore", [
      "selectItem",
      "unselectAll",
      "selectTraceback"
    ]),

    /**
     * Hotkey Store actions
     */
    ...mapActions("HotkeyStore", ["isHotkeyActive"]),

    /**
     * Updates the tooltip's left offset.
     * @param parent
     *  The parent container's DOM rectangle.
     */
    updateLeftOffset(parent: DOMRect) {
      let width = this.$el.clientWidth;
      let offset = this.leftOffset;
      let tooltipRight = parent.left + this.objectRegion.left - offset + width;
      if(parent.right < tooltipRight) {
        let left = this.objectRegion.right - width + offset;
        let maxLeft = parent.right - parent.left - width;
        this.left = `${ Math.min(left, maxLeft) }px`;
      } else {
        let left = this.objectRegion.left - offset;
        this.left = `${ Math.max(0, left) }px`;
      }
    },

    /**
     * Returns a node's title.
     * @param node
     *  The node to evaluate.
     * @returns
     *  The node's title.
     */
    formatTitle(node: ActivitySetCommonNode): string {
      let title;
      if(node instanceof ActivitySetAnalyticNode) {
        title = node.data.attack_tactic;
      } else if(node instanceof ActivitySetEventNode) {
        title = node.data.car_attributes;
      } else {
        title = "[ Invalid Node Type ]";
      }
      return title !== undefined ? titleCase(title) : "[ Missing Key ]";
    },

    /**
     * Returns a node's subtitle.
     * @param node
     *  The node to evaluate.
     * @returns
     *  The node's subtitle.
     */
    formatSubtitle(node: ActivitySetCommonNode): string {
      let subtitle;
      if(node instanceof ActivitySetAnalyticNode) {
        subtitle = `${ node.data.attack_technique_id } - ${ node.data.analytic_name }`
      } else if(node instanceof ActivitySetEventNode) {
        subtitle = node.data.exe;
      } else {
        subtitle = "[ Invalid Node Type ]";
      }
      return subtitle !== undefined ? subtitle : "[ Missing Key ]";
    },

    /**
     * Returns a node's color.
     * @param node
     *  The node to evaluate.
     * @returns
     *  The node's color.
     */
    getColor(node: ActivitySetCommonNode): string {
      return ColorMap[node.style & FillColorMask]
    },

    /**
     * Returns a node's selected color.
     * @param node
     *  The node to evaluate.
     * @returns
     *  The node's selected color. "none" if the node is not selected.
     */
    getSelectedColor(node: ActivitySetCommonNode): string {
      if(this.selected.has(node.id)) {
        return ColorMap[(node.style & Stroke2ColorMask) >>> 4];
      } else {
        return "none";
      }
    },

    /**
     * Tooltip item click behavior.
     * @param id
     *  The id of the clicked item.
     */
    async onItemClick(id: string) {
      if (!await this.isHotkeyActive(this.multiSelectHotkey)) {
        this.unselectAll();
      }
      if (await this.isHotkeyActive(this.tracebackHotKey)) {
        this.selectTraceback(id);
      } else {
        this.selectItem(id);
      }
    }

  },
  mounted() {
    // Store parent container
    let p = this.$el.parentElement;
    while(p !== null && getComputedStyle(p).position !== "relative")
      p = p.parentElement;
    this.parent = p;
  }
});
</script>

<style scoped>

/** === Main Element === */

.event-tooltip-element {
  position: absolute;
  display: flex;
  font-size: 9.5pt;
  font-weight: 500;
  width: max-content;
  z-index: 9;
}
.event-tooltip-element.above {
  flex-direction: column;
  padding-top: 0px !important;
}
.event-tooltip-element.below {
  flex-direction: column-reverse;
  padding-bottom: 0px !important;
}

.events {
  display: flex;
  flex-direction: row;
  border: solid 1px #434343;
  border-radius: 3px;
  background: #303030;
  box-shadow: 2px 2px 4px rgb(0 0 0 / 26%);
  overflow: hidden;
}

/** === Tooltip Item === */

.infos,
.timestamps {
  display: flex;
}
.above .infos,
.above .timestamps {
  flex-direction: column; 
}
.below .infos,
.below .timestamps {
  flex-direction: column-reverse;
}

.infos {
  border-right: solid 1px #434343;
}

.above .info:not(:last-child), 
.below .info:not(:first-child),
.above .timestamp:not(:last-child),
.below .timestamp:not(:first-child) {
  border-bottom: solid 1px #434343;
}

.info {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px 8px;
  box-sizing: border-box;
  cursor: pointer;
}

.color {
  display: block;
  width: 6px;
  height: 39px;
  margin-right: 8px;
}

.info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-right: 8px;
}
.info-text .title {
  color: #dbdbdb;
  font-size: 11pt;
  font-weight: 600;
  margin-bottom: 1px;
}
.info-text .subtitle {
  color: #b3b3b3;
  font-size: 10pt;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 300px;
  overflow: hidden;
}

.timestamp {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0px 11px;
  box-sizing: border-box;
  background: #262626;
}
.timestamp .date {
  color: #8f8f8f;
  font-size: 10pt;
  font-weight: 600;
  margin-bottom: 2px;
}
.timestamp .time {
  color: #b0b0b0;
  font-size: 11pt;
  font-weight: 600;
}
.timestamp .minor-time {
  font-size: 9pt;
  font-weight: 500;
}

/** === "More Items" Item === */

.more-items {
  display: flex;
  flex-direction: row;
  align-items: center;
  color: #fff;
  font-weight: 600;
  font-size: 11pt;
  width: 100%;
  height: 35px;
  padding: 0px 16px 0px 8px;
  border: solid 1px #ef684d;
  border-radius: 3px;
  box-sizing: border-box;
  background: #f95939;
  box-shadow: 2px 2px 4px rgb(0 0 0 / 26%);
  z-index: 1;
}
.above .more-items {
  margin-bottom: 4px;
}
.below .more-items {
  margin-top: 4px;
}

.more-items .color {
  display: block;
  width: 6px;
  height: 21px;
  margin-right: 8px;
  background: #fff;
}

/** === Select Dot === */

.select-dot {
  width: 8px;
  height: 8px;
  border: solid 1px #303030;
  border-radius: 3px;
  margin-bottom: 26px;
}

.info:hover .select-dot:not(.on) {
  border-color: #7a7a7a;
}

</style>
