<template>
  <div class="app-window-area-element">
    <transition-group name="popup" :duration="120">
      <div
        class="drag-wrapper" 
        :id="id"
        :style="getOffset(id)"
        v-for="{ id, component, title, data } of windows" :key="id"
      >
        <component
          class="window"
          v-bind:is="component" :data=data
          :title="title"
          @grab="startWindowDrag($event, id)"
          @mousedown="onWindowClick(id)"
          @close="onClose(id)"
        />
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
import { clamp } from "@/assets/scripts/Math";
import { defineComponent } from "vue";
import { mapActions, mapState } from "vuex";

export default defineComponent({
  name: "AppWindowArea",
  data() { 
    return {
      drag: {
        base   : [0, 0],
        origin : [0, 0],
        offset : [0, 0],
        bounds : null as Bound | null,
        target : null as HTMLElement | null
      },
      offsets: new Map() as Map<string, number[]>,
      onResizeObserver: null as ResizeObserver | null
    }
  },
  computed: {

    /**
     * Window Manager Store data
     */
    ...mapState("WindowManagerStore", ["windows"]),
  
  },
  methods: {

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", [
      "closeWindow",
      "bringWindowToFront"
    ]),

    /**
     * Window click behavior.
     * @param id
     *  The id of the clicked window.
     */
    onWindowClick(id: string) {
      this.bringWindowToFront(id);
    },

    /**
     * Window drag start behavior.
     * @param event
     *  The pointer event.
     * @param id
     *  The id of the window being dragged.
     */
    startWindowDrag(event: PointerEvent, id: string) {
      // Setup drag state
      if(!this.offsets.has(id))
        this.offsets.set(id, [0, 0]);
      this.drag.base = [...this.offsets.get(id)!];
      this.drag.offset = this.offsets.get(id)!;
      this.drag.origin = [event.x, event.y];
      this.drag.target = event.target as HTMLElement;
      this.drag.bounds = this.computeOffsetSpace(this.drag.target);
      this.drag.target!.onpointermove = this.onWindowDrag;
      document.addEventListener("pointerup", this.stopWindowDrag, { once: true });
      // Capture pointer
      this.drag.target!.setPointerCapture(event.pointerId);
    },

    /**
     * Window drag behavior.
     * @param event
     *  The pointer event.
     */
    onWindowDrag(event: PointerEvent) {
      event.preventDefault();
      let origin = this.drag.origin;
      let bounds = this.drag.bounds!;
      // Calculate cumulative delta
      let dx = clamp(event.x - origin[0], -bounds.left, bounds.right);
      let dy = clamp(event.y - origin[1], -bounds.top, bounds.bottom);
      // Add cumulative delta to base offset to get new offset
      this.drag.offset[0] = this.drag.base[0] + dx;
      this.drag.offset[1] = this.drag.base[1] + dy;
    },
    
    /**
     * Window stop drag behavior.
     * @param event
     *  The pointer event.
     */
    stopWindowDrag(event: PointerEvent) {
      // Unbind event callbacks
      this.drag.target!.onpointermove = null;
      // Release pointer
      this.drag.target!.releasePointerCapture(event.pointerId);
    },

    /**
     * Window close behavior.
     * @param id
     *  The id of the window to close.
     */
    onClose(id: string) {
      // Close window
      this.closeWindow(id);
      // Clear offset
      this.offsets.delete(id);
    },

    /**
     * Window area resize behavior.
     */
    onAreaResize() {
      for(let child of this.$el.children) {
        let bound = this.computeOffsetSpace(child);
        let xShift = 0, yShift = 0;
        if(bound.left < 0) {
          xShift = -bound.left;
        } else if(bound.right < 0) {
          xShift = Math.max(-bound.left, bound.right);
        }
        if(bound.top < 0) {
          yShift = -bound.top;
        } else if(bound.bottom < 0) {
          yShift = Math.max(-bound.top, bound.bottom);
        }
        if(xShift === 0 && yShift === 0) {
          continue;
        } else if(!this.offsets.has(child.id)) {
          this.offsets.set(child.id, [xShift, yShift]);
        } else {
          let offset = this.offsets.get(child.id)!;
          offset[0] += xShift;
          offset[1] += yShift;
        }
      }
    },
    
    /**
     * Returns a window's offset styling.
     * @param id
     *  The id of the window.
     * @returns
     *  The window's offset styling.
     */
    getOffset(id: string): { transform: string } {
      let offset = this.offsets.get(id) ?? [0, 0];
      return { transform: `translate(${ offset[0] }px, ${ offset[1] }px)` }
    },

    /**
     * Computes an element's permitted range of movement inside the area.
     * @param element
     *  The element to evaluate.
     * @returns
     *  [top]
     *   The total amount of space (in px) above the element.
     *  [left]
     *   The total amount of space (in px) left of the element.
     *  [right]
     *   The total amount of space (in px) right of the element.
     *  [bottom]
     *   The total amount of space (in px) below the element.
     */
    computeOffsetSpace(element: HTMLElement): Bound {
      let parent = this.$el.getBoundingClientRect();
      let child = element.getBoundingClientRect();
      return { 
        top: child.top - parent.top,
        left: child.left - parent.left, 
        right:  parent.right - child.right, 
        bottom: parent.bottom - child.bottom
      }
    }
    
  },
  mounted() {
    this.onResizeObserver = new ResizeObserver(() => this.onAreaResize());
    this.onResizeObserver.observe(this.$el);
  },
  unmounted() {
    this.onResizeObserver?.disconnect();
  }
});

type Bound = {
  top: number,
  left: number,
  right: number,
  bottom: number
}

</script>

<style scoped>

/** === Main Element === */

.app-window-area-element {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: hidden;
}
.drag-wrapper {
  position: absolute;
  z-index: 9999;
}
.window {
  pointer-events: all;
}

/** === Window Animation === */

.popup-enter-active .window,
.popup-leave-active .window {
  transition: all .12s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.popup-leave-to .window,
.popup-enter-from .window {
  transform: scale(0.9);
  opacity: 0;
}

</style>
