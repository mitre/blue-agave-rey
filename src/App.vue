<template>
  <div id="main-app" :class="LayoutClass[layoutMode]">
    <AppTitleBar id="app-title-bar" />
    <div id="app-body" ref="body" :style="gridLayout" @contextmenu.prevent>
      <GraphView id="graph-view" :rightCover="frameSize.r" />
      <div class="frame top">
        <TimeSlider id="time-slider"/>
      </div>
      <div class="frame right" v-show="showRightFrame">
        <span class="resize-handle" @pointerdown="startResize($event, Resize.Right)" />
        <SelectionTabs 
          id="selection-tabs" 
          :canClose="layoutMode !== Layout.Timeline"
          @close="unselectAll" 
        />
      </div>
      <span id="vertical-border" v-if="showRightFrame" />
      <div class="frame bottom" v-if="showBottomFrame">
        <span class="resize-handle" @pointerdown="startResize($event, Resize.Bottom)" />
        <TimelineTab id="timeline-tab" @close="showTimeline(false)" />
      </div>
      <div :class="['frame', 'footer', { 'solo': !showBottomFrame }]">
        <AppFooter id="app-footer" />
      </div>
    </div>
  </div>
  <AppWindowArea id="app-window-area" />
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
// Dependencies
import { clamp } from "./assets/scripts/Math";
import { MouseTracker } from "./assets/scripts/WebUtilities/MouseTracker";
import { mapActions, mapState } from "vuex";
import { defineComponent, ref, markRaw } from "vue";
// Components
import AppFooter from "@/components/Elements/AppFooter.vue";
import GraphView from "@/components/Elements/GraphView.vue";
import TimeSlider from "@/components/Elements/TimeSlider.vue";
import TimelineTab from "@/components/Elements/TimelineTab.vue";
import AppTitleBar from "@/components/Elements/AppTitleBar.vue";
import AppWindowArea from "@/components/Elements/AppWindowArea.vue";
import SelectionTabs from "@/components/Elements/SelectionTabs.vue";

const Resize = {
  None   : 0,
  Bottom : 1,
  Right  : 2
}

const Layout = {
  Graph: 0,
  Mixed: 1,
  Timeline: 2
}

const LayoutClass = {
  [Layout.Graph]: "graph-mode",
  [Layout.Mixed]: "mixed-mode",
  [Layout.Timeline]: "timeline-mode" 
}

export default defineComponent({
  name: "App",
  setup() {
    return { body: ref(null) };
  },
  data() {
    return { 
      Resize,
      Layout,
      LayoutClass,
      bodyWidth: -1,
      bodyHeight: -1,
      frameSize: {
        t: 86,   // Top
        l: 150,  // Left
        r: 468,  // Right
        b: 290,  // Bottom
        f: 27    // Footer
      },
      minFrameSize: {
        r: 200,
        b: 100,
      },
      drag: {
        handle: Resize.None,
        track: markRaw(new MouseTracker())
      },
      mixedLayoutThreshold: 200,
      onResizeObserver: null as ResizeObserver | null
    };
  },
  computed: {

    /**
     * Activity Sets Store data
     */
    ...mapState("ActivitySetsStore", {
      hasSelection(state: Store.ActivitySetsStore): boolean {
        return 0 < state.selected.size;
      }
    }),

    /**
     * App Settings Store data
     */
    ...mapState("AppSettingsStore", {
      showBottomFrame(state: Store.AppSettingsStore): boolean {
        return state.settings.view.app.appearance.timeline;
      }
    }),

    /**
     * Returns the right frame's visibility state.
     * @returns
     *  The right frame's visibility state.
     */
    showRightFrame(): boolean {
      return this.hasSelection || this.layoutMode === Layout.Timeline;
    },

    /**
     * Returns the current layout mode.
     * @returns
     *  The current layout mode.
     */
    layoutMode(): number {
      if(this.bodyWidth === -1)
        return Layout.Graph;
      let b = this.showBottomFrame ? this.frameSize.b : 0;
      let size = this.bodyHeight 
        - this.frameSize.t 
        - this.frameSize.f
        - b;
      if(size === 0) {
        return Layout.Timeline
      } else if(size < this.mixedLayoutThreshold && this.hasSelection) {
        return Layout.Mixed
      } else {
        return Layout.Graph;
      }
    },

    /**
     * Returns the current grid layout.
     * @returns
     *  The current grid layout.
     */
    gridLayout(): { gridTemplateColumns: string, gridTemplateRows: string } {
      let { t, r, b, f } = this.frameSize;
      b = this.showBottomFrame ? b : 0;
      return {
        gridTemplateColumns: `minmax(0, 1fr) ${ r }px`,
        gridTemplateRows: `${ t }px minmax(0, 1fr) ${ b }px ${ f }px`
      }
    }

  },
  methods: {
    
    /**
     * Activity Sets Store actions
     */
    ...mapActions("ActivitySetsStore", ["unselectAll"]),

    /**
     * App Settings Store actions
     */
    ...mapActions("AppSettingsStore", [
      "showTimeline",
      "loadAppSettings"
    ]),

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", ["openExceptionWindow"]),

    /**
     * Activity Set Importer actions
     */
    ...mapActions("ActivitySetImporter", ["importActivitySetFileById"]),

    /**
     * Resize handle drag start behavior.
     * @param event
     *  The pointer event.
     * @param handle
     *  The id of the handle being dragged.
     */
    startResize(event: PointerEvent, handle: number) {
      this.drag.handle = handle;
      this.drag.track.capture(event, this.onResize);
      document.addEventListener("pointerup", this.stopResize, { once: true });
    },

    /**
     * Resize handle drag behavior.
     * @param event
     *  The pointer event.
     * @param track
     *  The mouse tracker.
     */
    onResize(event: PointerEvent, track: MouseTracker) {
      event.preventDefault();
      let fs = this.frameSize;
      switch (this.drag.handle) {
        default:
        case Resize.None:
          break;
        case Resize.Bottom:
          this.setBottomFrameSize(fs.b - track.movementY);
          break;
        case Resize.Right:
          this.setRightFrameSize(fs.r - track.movementX);
          break;
      }
    },

    /**
     * Resize handle drag stop behavior.
     * @param event
     *  The pointer event.
     */
    stopResize(event: PointerEvent) {
      this.drag.handle = Resize.None;
      this.drag.track.release(event);
    },

    /**
     * Sets the size of the bottom frame.
     * @param size
     *  The new size of the bottom frame.
     */
    setBottomFrameSize(size: number) {
      let max = this.bodyHeight - this.frameSize.t - this.frameSize.f;
      this.frameSize.b = clamp(size, this.minFrameSize.b, max);
    },

    /**
     * Sets the size of the right frame.
     * @param size
     *  The new size of the right frame.
     */
    setRightFrameSize(size: number) {
      let max = this.bodyWidth - this.frameSize.l;
      this.frameSize.r = clamp(size, this.minFrameSize.r, max);
    }

  },
  async created() {
    try {
      // Load application settings
      await this.loadAppSettings();
      // Import from query parameters
      let params = new URLSearchParams(window.location.search);
      if(params.get("ids")) {
        let lm = params.get("lm")?.toLocaleLowerCase() === "true";
        let ids = params.get("ids")!.split(",");
        let refs = params.get("refs")?.split(",") ?? [];
        await this.importActivitySetFileById(
            { ids, refs, importLateralMoves: lm }
        );
      }
    } catch(ex) {
      this.openExceptionWindow({ ex, src: "<App>" });
    } 
  },
  mounted() {
    let body: HTMLElement = this.body!;
    this.bodyWidth = body.clientWidth;
    this.bodyHeight = body.clientHeight;
    this.onResizeObserver = new ResizeObserver(() => {
      // Update current body size
      this.bodyWidth = body.clientWidth;
      this.bodyHeight = body.clientHeight;
      // Restrict bottom and right frames
      this.setBottomFrameSize(this.frameSize.b);
      this.setRightFrameSize(this.frameSize.r);
    });
    this.onResizeObserver.observe(body);
  },
  unmounted() {
    this.onResizeObserver?.disconnect();
  },
  components: {
    AppFooter,
    GraphView,
    TimeSlider,
    TimelineTab,
    AppTitleBar,
    AppWindowArea,
    SelectionTabs
  },
});
</script>

<style>

/** === Global === */

html,
body {
  width: 100%;
  height: 100%;
  font-family: "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 0px;
  margin: 0px;
  background: #1a1a1a;
  overflow: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

p {
  margin: 0px;
}

ul {
  margin: 0px;
  padding: 0px;
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  color: #bfbfbf;
  font-family: "Inter", sans-serif;
  font-size: 10.5pt;
  font-weight: 600;
  border: solid 1px #141414;
  border-radius: 3px;
  box-sizing: border-box;
  background: #3d3d3d;
  user-select: none;
}
button:hover {
  color: #cccccc;
  background: #474747;
}
button:disabled {
  color: #8f8f8f;
  border: solid 1px #1f1f1f;
  background: #383838;
}

input[type=text] {
  height: 28px;
  color: #bfbfbf;
  font-family: "Inter", sans-serif;
  padding: 3px 8px;
  border: solid 1px #4d4d4d;
  border-radius: 3px;
  box-sizing: border-box;
  background: #303030;
}
input[type=text]::placeholder {
  color: #999999;
  font-family: "Inter", sans-serif;
  font-size: 10pt;
}
input[type=text]:focus {
  outline: none;
}

/** === Main App === */

#app {
  width: 100%;
  height: 100%;
}

#main-app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

#app-title-bar {
  flex-shrink: 0;
  height: 32px;
  color: #858585;
  box-sizing: border-box;
  background: #141414;
}

#app-body {
  flex: 1;
  display: grid;
  overflow: hidden;
}

#app-window-area {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
}

/** === Frames === */

.frame {
  position: relative;
  display: flex;
  padding: 1px;
  box-sizing: border-box;
  background: #242424;
  user-select: none;
}

/** === Top Frame === */

.frame.top {
  flex-direction: column;
  grid-column: 1 / 3;
  grid-row: 1;
}

/** === Bottom Frame === */

.frame.bottom {
  flex-direction: column;
  grid-column: 1 / 3;
  grid-row: 3;
  padding: 1px 1px 0px;
}
.mixed-mode .frame.bottom {
  grid-column: 1 / 2;
  padding: 1px 0px 0px 1px;
}
.timeline-mode .frame.bottom {
  grid-column: 1 / 2;
  padding: 0px 0px 0px 1px;
}

/** === Right Frame === */

.frame.right {
  flex-direction: row;
  grid-column: 2;
  grid-row: 2;
  padding: 0px 1px;
}
.mixed-mode .frame.right,
.timeline-mode .frame.right {
  grid-row: 2 / 4;
}

/** === Footer Frame === */

.frame.footer {
  flex-direction: column;
  grid-column: 1 / 3;
  grid-row: 4;
  padding: 0px 1px;
}
.frame.footer.solo {
  padding: 0px;
}

/** === Frame Content === */

#time-slider,
#timeline-tab,
#selection-tabs {
  flex: 1;
}

#selection-tabs {
  min-width: 360px;
}

#graph-view {
  grid-column: 1 / 3;
  grid-row: 2;
  border-style: solid none;
  border-width: 1px;
  border-color: #0f0f0f;
  box-sizing: border-box;
}

#app-footer {
  flex: 1;
  border-style: none solid;
  border-width: 1px;
  border-color: #0f0f0f;
  background: #212121;
}
.solo #app-footer {
  border: none;
}

#vertical-border {
  position: relative;
  display: block;
  grid-column: 2;
  grid-row: 2;
  left: -1px;
  width: 0px;
  border-left: solid 1px #0f0f0f;
  user-select: none;
}

/** === Resize Handles === */

.resize-handle {
  position: absolute;
  display: block;
  background: #f95939;
  transition: 0.25s opacity;
  opacity: 0;
  z-index: 1;
}
.resize-handle:hover {
  transition-delay: 0.2s;
  opacity: 1;
}

.frame.right .resize-handle {
  top: 0px;
  left: -2px;
  width: 4px;
  height: 100%;
  cursor: e-resize;
}
.frame.bottom .resize-handle {
  top: -2px;
  left: 0px;
  width: 100%;
  height: 4px;
  cursor: n-resize;
}

</style>
