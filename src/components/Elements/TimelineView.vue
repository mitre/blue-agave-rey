<template>
  <div class="timeline-view-element">
    <div class="controls">
      <DropdownMenu class="control" type="micro" pretext="Breakout by" :text="breakout.text">
        <DropdownItems
          class="dropdown-items"
          :options="breakouts"
          :selected="breakout.id"
          @select="onBreakoutSelect"
        />
      </DropdownMenu>
      <DropdownMenu class="control" type="micro" pretext="Sort by" :text="sort.text">
        <DropdownItems
          class="dropdown-items"
          :options="sorts"
          :selected="sort.id"
          @select="onSortSelect"
        />
      </DropdownMenu>
      <DropdownMenu class="control" type="micro" pretext="Filter by">
        <DropdownFilterItems
          class="dropdown-items"
          :filters="filters"
          @select="onFilterSelect"
        />
      </DropdownMenu>
      <LabeledCheckbox
        class="control"
        text="Show Day / Night" 
        :checked="displayDayNightHighlighting"
        @change="onHighlightChange"
      />
      <LabeledCheckbox
        class="control"
        text="Stack Types" 
        :checked="stackCarTypes"
        @change="onStackChange"
      />
    </div>
    <div 
      ref="tlContainer" 
      class="timeline"
      @mouseleave="tooltip.show = false"
    >
      <EventTooltip
        class="timeline-tooltip"
        v-show="tooltip.show"
        :items="tooltip.items"
        :objectRegion="tooltip.region"
      />
      <ContextMenu
        class="timeline-context-menu"
        v-if="menu.show"
        :style="menuStyle"
        :sections="menuOptions"
        @unfocus="closeContextMenu"
        @select="onMenuItemSelect"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Features from "@/assets/rey.features";
import * as Store from "@/store/StoreTypes";
// Dependencies
import { Timeline } from "@/assets/scripts/Visualizations/Timeline/Timeline";
import { Timeframe } from "@/assets/scripts/Collections/Timeframe";
import { MouseClick } from "@/assets/scripts/WebUtilities/WebTypes";
import { GenericViewItem } from "@/assets/scripts/Visualizations/ViewBaseTypes/GenericViewItem";
import { TimelineReloadError } from "@/components/Exceptions/TimelineReloadError";
import { ActivitySetCommonNode } from "@/assets/scripts/ViewData/ViewNode";
import { ActivitySetTimelineLane } from "@/assets/scripts/ViewData/ViewTimelineLane";
import { mapActions, mapGetters, mapState } from "vuex";
import { defineComponent, markRaw, Ref, ref, toRaw } from "vue";
const { breakout_features } = Features.activity_set_timeline;
// Components
import ContextMenu from "@/components/Controls/ContextMenu.vue";
import EventTooltip from "@/components/Elements/EventTooltip.vue";
import DropdownMenu from "@/components/Controls/DropdownMenu.vue";
import DropdownItems from "@/components/Controls/DropdownItems.vue";
import LabeledCheckbox from "@/components/Controls/LabeledCheckbox.vue";
import DropdownFilterItems from "@/components/Controls/DropdownFilterItems.vue";

export default defineComponent({
  name: "TimelineView",
  setup() {
    return { 
      tlContainer: ref(null) as Ref<HTMLElement | null>
    };
  },
  data() {
    return {
      menu: {
        x: 0,
        y: 0,
        show: false,
      },
      tooltip: {
        show: false,
        items: [] as ActivitySetCommonNode[],
        region: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        } as { 
          top: number, 
          left: number,
          right: number,
          bottom: number
        }
      },
      timeline: markRaw(new Timeline()),
      breakouts: breakout_features.map(
        o => ({ id: o.id, text: o.id })
      ) as Array<{ id: string, text: string }>,
      sorts: [
        { id: "name", text: "Name" },
        { id: "time", text: "Time" }
      ] as Array<{ id: string, text: string }>
    };
  },
  computed: {

    /**
     * Activity Sets Store data
     */
    ...mapState("ActivitySetsStore", {
      triggerDataLoaded(state: Store.ActivitySetsStore): number {
        return state.triggerDataLoaded;
      },
      triggerDataFocused(state: Store.ActivitySetsStore): number {
        return state.triggerDataFocused;
      },
      triggerDataSelected(state: Store.ActivitySetsStore): number {
        return state.triggerDataSelected;
      },
      timeframe(state: Store.ActivitySetsStore): Timeframe {
        return toRaw(state.timeframe);
      },
      focus(state: Store.ActivitySetsStore): Timeframe {
        return state.focus;
      },
      selected(state: Store.ActivitySetsStore): Map<string, GenericViewItem> {
        return state.selected;
      }
    }),

    /**
     * Activity Set Timeline Store data
     */
    ...mapState("ActivitySetTimelineStore", {
      triggerTimelineLayout(state: Store.ActivitySetTimelineStore): number {
        return state.triggerTimelineLayout;
      },
      lanes(state: Store.ActivitySetTimelineStore): ActivitySetTimelineLane[] {
        return state.lanes;
      }
    }),

    /**
     * App Settings Store data
     */
    ...mapState("AppSettingsStore", {
      display24HourTime(state: Store.AppSettingsStore): boolean {
        return state.settings.view.app.display_24_hour_time;
      },
      breakoutFeature(state: Store.AppSettingsStore): string {
        return state.active_timeline_breakout.id;
      },
      sortFeature(state: Store.AppSettingsStore): string {
        return state.active_timeline_sort.id;
      },
      displayDayNightHighlighting(state: Store.AppSettingsStore): boolean {
        return state.settings.view.app.display_day_night_highlighting;
      },
      dayNightModeTimeframe(state: Store.AppSettingsStore): Timeframe {
        return state.active_day_night_mode.timeframe;
      },
      stackCarTypes(state: Store.AppSettingsStore): boolean {
        return state.settings.view.timeline.stack_car_types;
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
     * Context Menu Store data
     */
    ...mapGetters("ContextMenuStore", [
      "snapFocusSubmenu",
      "dayNightModesSubmenu",
      "itemSelectionSubmenu",
      "nudgeIntervalsSubmenu",
      "massSelectionMenuSection",
    ]),

    /**
     * Returns the current breakout feature.
     * @returns
     *  The current breakout feature.
     */
    breakout(): { id: string | null, text: string } {
      let b = this.breakouts.find(o => o.id === this.breakoutFeature);
      return b ?? { id: null, text: '' }
    },

    /**
     * Returns the current sort feature.
     * @returns
     *  The current sort feature.
     */
    sort(): { id: string | null, text: string } {
      let s = this.sorts.find(o => o.id === this.sortFeature);
      return s ?? { id: null, text: '' };
    },

    /**
     * Returns the current timeline filter state.
     * @returns
     *  The current timeline filter state.
     */
    filters(): { id: string, text: string, value: boolean }[] {
      let filters = [];
      for(let lane of this.lanes) {
        filters.push({
          id: lane.id,
          text: lane.id,
          value: lane.isVisible()
        })
      }
      return filters;
    },

    /**
     * Returns the current highlight timeframe.
     * @returns
     *  The current highlight timeframe.
     */
    highlightTimeframe(): Timeframe | null {
      try {
        return this.displayDayNightHighlighting ? 
          this.dayNightModeTimeframe : null;
      } catch(ex: any) {
        this.openExceptionWindow({
          ex: new TimelineReloadError(ex),
          src: "<TimelineView>"
        });
        return null;
      }
    },

    /**
     * Returns the timeline's context menu options.
     * @returns
     *  The timeline's context menu options.
     */
    menuOptions(): Store.ContextMenuSection[] {
      if (this.selected.size > 0) {
        return this.itemSelectionSubmenu.sections;
      } else {
        return [
          this.massSelectionMenuSection,
          ...this.snapFocusSubmenu.sections,
          { 
            id: "modes", 
            items: [ this.dayNightModesSubmenu ]
          },
          { 
            id: "intervals", 
            items: [ this.nudgeIntervalsSubmenu ]
          }
        ];
      }
    },

    /**
     * Returns the context menu's styling.
     * @returns
     *  The context menu's styling.
     */
    menuStyle(): { top: string; left: string } {
      return {
        top: `${this.menu.y}px`,
        left: `${this.menu.x}px`,
      };
    }

  },
  methods: {

    /**
     * Activity Sets Store actions
     */
    ...mapActions("ActivitySetsStore", [
      "zoomFocus",
      "slideFocus",
      "selectItem",
      "selectItems",
      "unselectAll",
      "selectTraceback"
    ]),

    /**
     * Activity Set Timeline Store actions
     */
    ...mapActions("ActivitySetTimelineStore", ["setLaneVisibility"]),

    /**
     * App Settings Store actions
     */
    ...mapActions("AppSettingsStore", [
      "setTimelineSort",
      "setTimelineBreakout",
      "setAppDisplaySetting",
      "setTimelineStackCarTypes",
    ]),

    /**
     * Context Menu Store actions
     */
    ...mapActions("ContextMenuStore", ["selectMenuItem"]),

    /**
     * Hotkey Store actions
     */
    ...mapActions("HotkeyStore", ["isHotkeyActive"]),

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", ["openExceptionWindow"]),

    /**
     * Node click behavior.
     * @param event
     *  The pointer event.
     * @param node
     *  The node that was clicked.
     * @param x
     *  The click event's x coordinate (relative to the timeline container).
     * @param y
     *  The click event's y coordinate (relative to the timeline container).
     */
    async onNodeClick(
      event: PointerEvent, node: ActivitySetCommonNode, x: number, y: number
    ) {
      if (
        !(await this.isHotkeyActive(this.multiSelectHotkey)) &&
        !node.isSelected()
      ) {
        this.unselectAll();
      }
      if (await this.isHotkeyActive(this.tracebackHotKey)) {
        this.selectTraceback(node.id);
      } else {
        this.selectItem(node.id);
      }
      if (event.button === MouseClick.Right) {
        this.openContextMenu(x, y);
      }
    },

    /**
     * Canvas click behavior.
     * @param event
     *  The pointer event.
     * @param x
     *  The click event's x coordinate (relative to the timeline container).
     * @param y
     *  The click event's y coordinate (relative to the timeline container).
     */
    async onCanvasClick(event: PointerEvent, x: number, y: number) {
      if (await this.isHotkeyActive(this.tracebackHotKey)) {
        this.unselectAll();
      }
      if (event.button === MouseClick.Right) {
        this.unselectAll();
        this.openContextMenu(x, y);
      } else {
        this.closeContextMenu();
      }
    },

    /**
     * Context menu item selection behavior.
     * @param id
     *  The id of the selected menu item.
     * @param data
     *  Auxillary data included with the selection.
     */
    async onMenuItemSelect(id: string, data: any) {
      try {
        await this.selectMenuItem({ id, data });
      } catch(ex: any) {
        this.openExceptionWindow({ 
          ex, src: "<AppTitleBar>"
        });
      }
      this.closeContextMenu();
      this.tooltip.show = false;
    },

    /**
     * Opens the context menu.
     * @param x
     *  The menu's x coordinate (relative to the timeline container).
     * @param y
     *  The menu's y coordinate (relative to the timeline container).
     */
    openContextMenu(x: number, y: number) {
      // Allow unfocus event to run first (if context
      // menu is already present) then show context menu.
      requestAnimationFrame(() => {
        this.menu.show = true;
        this.menu.x = x;
        this.menu.y = y;
      })
    },

    /**
     * Closes the context menu.
     */
    closeContextMenu() {
      this.menu.show = false;
    },

    /**
     * Breakout selection behavior.
     * @param option
     *  The breakout option selected.
     */
    onBreakoutSelect(option: { id: string, text: string }) {
      try {
        this.setTimelineBreakout(option.id);
      } catch(ex: any) {
        this.openExceptionWindow({ ex, src: "<TimelineView>" })
      }
    },

    /**
     * Sort selection behavior.
     * @param option
     *  The sort option selected.
     */
    onSortSelect(option: { id: string, text: string }) {
      try {
        this.setTimelineSort(option.id);
      } catch(ex: any) {
        this.openExceptionWindow({ ex, src: "<TimelineView>" })
      }
    },

    /**
     * Filter selection behavior.
     * @param id
     *  The id of the selected filter.
     * @param value
     *  The filter's new value.
     */
    onFilterSelect(id: string, value: boolean) {
      this.setLaneVisibility({ id, value });
    },

    /**
     * Highlight checkbox selection behavior.
     * @param highlight
     *  The highlight state selected.
     */
    onHighlightChange(highlight: boolean) {
      this.setAppDisplaySetting({
        id: "display_day_night_highlighting",
        value: highlight
      })
    },

    /**
     * Stack checkbox selection behavior.
     * @param stack
     *  The stack state selected.
     */
    onStackChange(stack: boolean) {
      this.setTimelineStackCarTypes(stack);
    }

  },
  watch: {
    // On data loaded trigger
    triggerDataLoaded() {
      this.timeline.setTimeframe(this.timeframe);
      this.timeline.render();
    },
    // On data focused trigger
    triggerDataFocused() {
      this.timeline.setFocus(this.focus);
      this.timeline.render();
    },
    // On data selected trigger
    triggerDataSelected() {
      this.timeline.refreshAppearances();
      this.timeline.render();
    },
    // On timeline layout trigger
    triggerTimelineLayout() {
      try {
        this.timeline.setLanes(this.lanes);
        this.timeline.render(true);
      } catch(ex: any) {
        this.openExceptionWindow({
          ex: new TimelineReloadError(ex),
          src: "<TimelineView>"
        });
      }
    },
    // On 24 hour time display change
    display24HourTime() {
      this.timeline.setDisplay24HourTime(this.display24HourTime);
      this.timeline.render();
    },
    // On highlight timeframe change
    highlightTimeframe() {
      this.timeline.setDayTimeframe(this.highlightTimeframe);
      this.timeline.render();
    }
  },
  async mounted() {
    try {

      // Style timeline
      await this.timeline.setTimelineStyle({
        backgroundColor: "#2b2b2b",
        alternatingColor: "#1a1a1a",
        lanesTopPadding: 1,
        header: {
          height: 36,
          fillColor: "#212121",
          strokeColor: "#0f0f0f",
        },
        ticker: {
          dateFont: {
            lineHeight: 15,
            family: "Roboto Mono",
            color: "#808080",
            size: "9pt",
          },
          timeFont: {
            lineHeight: 14,
            family: "Roboto Mono",
            color: "#bfbfbf",
            size: "9pt",
          },
          textSidePadding: 7,
          lineColor: "#383838",
          minimumIntervalWidth: 120
        },
        lanes: {
          font: {
            lineHeight: 9,
            family: "Inter",
            color: "#949494",
            size: "9pt",
          },
          textSidePadding: 7,
          lineColor: "#383838",
          innerLaneGap: 10,
        },
        ticks: { width: 4, gap: 2 }
      });

      // Subscribe to timeline events
      this.timeline.on("canvas-click", (event, x, y) => {
        this.onCanvasClick(event, x, y);
      })
      this.timeline.on("canvas-drag", duration => {
        this.slideFocus(duration);
      });
      this.timeline.on("canvas-zoom", (focalTime, delta) => {
        this.zoomFocus({ focalTime, delta });
      });
      this.timeline.on("node-click", (event, nodes, x, y) => {
        let node = nodes.slice(-1)[0] as ActivitySetCommonNode;
        this.onNodeClick(event, node, x, y);
      });
      this.timeline.on("node-dblclick", (event, nodes) => {
        this.unselectAll();
        this.selectItems(nodes.map(n => n.id));
      })
      this.timeline.on("node-mouseenter", (subjects, boundingBox) => {
        this.tooltip.show = true;
        this.tooltip.items = subjects as ActivitySetCommonNode[];
        this.tooltip.region = boundingBox;
      });
      this.timeline.on("node-mouseleave", () => {
        this.tooltip.show = false;
      });

      // Inject timeline
      this.timeline.inject(this.tlContainer!);
      
      // Load state
      this.timeline.setDisplay24HourTime(this.display24HourTime);
      this.timeline.setDayTimeframe(this.highlightTimeframe);
      this.timeline.setTimeframe(this.timeframe);
      this.timeline.setFocus(this.focus);
      this.timeline.setLanes(this.lanes);

    } catch(ex: any) {
      this.openExceptionWindow({
        ex: new TimelineReloadError(ex),
        src: "<TimelineView>"
      });
    }
  },
  unmounted() {
    this.timeline.destroy();
  },
  components: {
    ContextMenu, 
    EventTooltip,
    DropdownMenu, 
    DropdownItems,
    LabeledCheckbox,
    DropdownFilterItems
  }
});
</script>

<style scoped>

/** === Main Element === */

.timeline-view-element {
  display: flex;
  flex-direction: column;
}

.timeline-context-menu {
  position: absolute;
}

/** === Timeline Controls === */

.controls {
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: center;
  height: 27px;
  border-bottom: solid 1px #0f0f0f;
  box-sizing: border-box;
}

.control:not(:first-child):before,
.control:last-child:after {
  content: "";
  display: block;
  width: 0px;
  height: 20px;
  border-right: solid 1px #383838;
  box-sizing: border-box;
}
.control.active:before,
.control.active + .control:before,
.control:not(.labeled-checkbox-control):hover:before,
.control:not(.labeled-checkbox-control):hover + .control:before {
  height: 100%;
}

.dropdown-items {
  min-width: calc(100% + 1px);
  max-height: 220px;
}
.dropdown-items.below {
  border-top: dotted 1px #474747;
}
.dropdown-items.above {
  border-bottom: dotted 1px #474747;
}
.dropdown-items.right {
  margin-right: -1px;
}

.labeled-checkbox-control,
.dropdown-menu-control {
  color: #8c8c8c;
  height: 100%;
}
.dropdown-menu-control:hover,
.dropdown-menu-control.active {
  color: #b3b3b3;
  background: #2b2b2b;
}
.labeled-checkbox-control:hover{
  color: #b3b3b3;
}

/** === Timeline === */

.timeline {
  position: relative;
  flex: 1;
}

</style>
