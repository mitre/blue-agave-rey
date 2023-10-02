<template>
  <div class="time-slider-element">
    <div 
      class="slide-window" 
      v-if="showSlideWindow"
      :style="sliderPosition"
      @pointerdown="startDrag($event, Handle.Center)"
    >
      <div class="slide-window-inner-1">
        <div class="slide-window-inner-2">
          <span
            class="handle left"
            @pointerdown.stop="startDrag($event, Handle.Left)"
          ></span>
          <span
            class="handle right"
            @pointerdown.stop="startDrag($event, Handle.Right)"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
import { Timeframe } from "@/assets/scripts/Collections/Timeframe";
import { MouseTracker } from "@/assets/scripts/WebUtilities/MouseTracker";
import { TimelinePreview } from "@/assets/scripts/Visualizations/TimelinePreview/TimelinePreview";
import { mapActions, mapState } from "vuex";
import { ActivitySetTimelineLane } from "@/assets/scripts/ViewData/ViewTimelineLane";
import { defineComponent, markRaw } from "vue";

const Handle = {
  None   : 0,
  Left   : 1,
  Right  : 2,
  Center : 3,
}

export default defineComponent({
  name: "TimeSlider",
  data() {
    return {
      Handle,
      drag: {
        track: markRaw(new MouseTracker()),
        handle: Handle.None,
        leftOffset: 0,
      },
      preview: markRaw(new TimelinePreview()),
      sliderPosition: {
        width: "0px",
        transform: "translateX(0px)"
      },
      onResizeObserver: null as ResizeObserver | null
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
      timeframe(state: Store.ActivitySetsStore): Timeframe {
        return state.timeframe;
      },
      focus(state: Store.ActivitySetsStore): Timeframe {
        return state.focus;
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
    }),

    /**
     * Returns the time slider's visibility state.
     * @returns
     *  The time slider's visibility state.
     */
    showSlideWindow(): boolean {
      return 0 < this.triggerDataLoaded;
    }

  },
  methods: {

    /**
     * Activity Sets Store actions
     */
    ...mapActions("ActivitySetsStore", [
      "slideFocus",
      "setFocusBeg",
      "setFocusEnd"
    ]),

    /**
     * Handle drag start behavior.
     * @param event
     *  The pointer event.
     * @param handle
     *  The id of the handle being dragged.
     */
    startDrag(event: PointerEvent, handle: number) {
      this.drag.handle = handle;
      this.drag.track.capture(event, this.onDrag);
      document.addEventListener("pointerup", this.stopDrag, { once: true });
      // +1 for this.$el's 1px border.
      this.drag.leftOffset = this.$el.getBoundingClientRect().left + 1;
    },

    /**
     * Handle drag behavior.
     * @param event
     *  The pointer event.
     * @param track
     *  The mouse tracker.
     */
    onDrag(event: PointerEvent, track: MouseTracker) {
      event.preventDefault();
      let x;
      switch (this.drag.handle) {
        default:
        case Handle.None:
          break;
        case Handle.Left:
          x = event.clientX - this.drag.leftOffset;
          this.setFocusBeg(this.preview.getTimeAtLocation(x));
          break;
        case Handle.Right:
          x = event.clientX - this.drag.leftOffset;
          this.setFocusEnd(this.preview.getTimeAtLocation(x));
          break;
        case Handle.Center:
          this.slideFocus(this.preview.getTimeLength(track.movementX));
          break;
      }
    },

    /**
     * Handle drag stop behavior.
     * @param event
     *  The pointer event.
     */
    stopDrag(event: PointerEvent) {
      this.drag.handle = Handle.None;
      this.drag.track.release(event);
    },

    /**
     * Updates the time slider's position.
     */
    updateSliderPosition() {
      let { x, width } = this.preview.getTimeframeLocationAndWidth(this.focus);
      this.sliderPosition.width = `${ width }px`;
      this.sliderPosition.transform = `translateX(${ Math.round(x) }px)`;
    }

  },
  watch: {
    // On data loaded trigger
    triggerDataLoaded() {
      this.preview.setTimeframeCoverage(this.timeframe);
      this.preview.render();
    },
    // On data focused trigger
    triggerDataFocused() {
      this.updateSliderPosition();
    },
    // On timeline layout trigger
    triggerTimelineLayout() {
      this.preview.setLanes(this.lanes);
      this.preview.render();
    },
    // On 24 hour time display change
    display24HourTime() {
      this.preview.setDisplay24HourTime(this.display24HourTime);
      this.preview.render();
    }
  },
  async mounted() {
    
    // Style timeline preview
    await this.preview.setPreviewStyle({
      backgroundColor: "#2b2b2b",
      hatchColor: "#414141",
      header: {
        height: 32,
        fillColor: "#212121",
        strokeColor: "#0f0f0f",
      },
      ticker: {
        dateFont: { 
          lineHeight: 13,
          family: "Roboto Mono",
          color: "#808080",
          size: "8.25pt",
        },
        timeFont: { 
          lineHeight: 13,
          family: "Roboto Mono",
          color: "#bfbfbf",
          size: "8.25pt"
        },
        textSidePadding: 5,
        lineColor: "#383838",
        minimumIntervalWidth: 100
      },
      preview: {
        verticalPadding: 2,
        tickWidth: 2,
      },
    })

    // Load preview
    this.preview.setDisplay24HourTime(this.display24HourTime);
    this.preview.setTimeframeCoverage(this.timeframe);
    this.preview.setLanes(this.lanes);
    
    // Inject preview and render
    this.preview.inject(this.$el);
    this.preview.render();
    
    // Set slider position
    this.updateSliderPosition();
    
    // Setup resize observer
    this.onResizeObserver = new ResizeObserver(() => {
      this.updateSliderPosition();
    });
    this.onResizeObserver.observe(this.$el);

  },
  unmounted() {
    // Disconnect resize observer
    this.onResizeObserver?.disconnect();
    // Destroy timeline preview
    this.preview.destroy();
  }
});
</script>

<style scoped>

/** === Main Element === */

.time-slider-element {
  position: relative;
  border: solid 1px #0f0f0f;
  overflow: hidden;
}

/** === Time Slider === */

.slide-window {
  position: absolute;
  top: 0px;
  left: 0px;
  height: 100%;
  border-style: none solid;
  border-width: 1px;
  border-color: #424242;
  box-sizing: border-box;
  user-select: none;
  cursor: grab;
}
.slide-window:active {
  cursor: grabbing;
}

.slide-window-inner-1 {
  width: 100%;
  height: 100%;
  border-style: none solid;
  border-width: 1px;
  border-color: #000;
  box-sizing: border-box;
}

.slide-window-inner-2 {
  width: 100%;
  height: 100%;
  border-style: none solid solid;
  border-width: 1px;
  border-color: #424242;
  box-sizing: border-box;
  background: #0505054d;
}

.handle {
  position: absolute;
  display: block;
  width: 10px;
  height: 32px;
  border-color: #424242;
  border-width: 1px;
  background: #000000;
  user-select: none;
  cursor: e-resize;
}
.handle::before {
  content: "";
  position: absolute;
  display: block;
  width: 11px;
  height: 100%;
  border-top: solid 1px #424242;
}
.handle::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 7px;
  border-left: solid 1px #ffffff4d;
  border-right: solid 1px #ffffff4d;
  margin-top: -3px;
  box-sizing: border-box;
}

.handle.left {
  left: 1px;
  border-style: none solid solid none;
}
.handle.left::before {
  left: -1px;
}
.handle.left::after {
  margin-left: -2px;
}

.handle.right {
  right: 1px;
  border-style: none none solid solid;
}
.handle.right::before {
  right: -1px;
}
.handle.right::after {
  margin-left: -1px;
}

</style>
