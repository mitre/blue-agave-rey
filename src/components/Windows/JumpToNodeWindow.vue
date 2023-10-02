<template>
  <Window 
    class="jump-to-node-window" 
    title="Jump to Node..."
    @close="onClose"
    @grab="onGrab"
  >
    <div class="window-contents">
      <input 
        type="text"
        ref="input"
        v-model="ids"
        class="node-id-field"
        placeholder="Node ID, Node ID, ..."
        @keyup="$event.key !== 'Enter' || jump()"
      />
      <button
        class="jump-button"
        :disabled="!areIdsValid"
        @click="jump"
      >
        Jump
      </button>
    </div>
  </Window>
</template>

<script lang="ts">
// Dependencies
import { mapActions } from "vuex";
import { defineComponent, Ref, ref } from "vue";
// Components
import Window from "@/components/Containers/Window.vue";

export default defineComponent({
  name: "JumpToNodeWindow",
  setup() {
    return {
      input: ref(null) as Ref<HTMLElement | null>
    }
  },
  data() {
    return {
      ids: ""
    }
  },
  computed: {

    /**
     * Returns true if the node ids are valid, false otherwise.
     * @returns
     *  True if the node ids are valid, false otherwise.
     */
    areIdsValid(): boolean {
      return 0 < this.ids.length;
    }

  },
  emits: ["grab", "close"],
  methods: {

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", ["openExceptionWindow"]),

    /**
     * Activity Sets Store actions
     */
    ...mapActions("ActivitySetsStore", [
      "unselectAll",
      "selectItems",
      "triggerCameraFocus"
    ]),

    /**
     * Window drag behavior.
     * @param event
     *  The pointer event.
     */
    onGrab(event: PointerEvent) {
      // Forward drag event from window component
      this.$emit("grab", event);
    },

    /**
     * Window close behavior.
     */
    onClose() {
      // Forward close event from window component
      this.$emit("close");
    },

    /**
     * Jumps to the specified nodes.
     */
    async jump() {
      // Close window
      this.$emit("close");
      // Select items
      await this.unselectAll();
      await this.selectItems(this.ids.split(",").map(o => o.trim()));
      // Trigger camera
      await this.triggerCameraFocus();
    }

  },
  mounted() {
    this.input!.focus();
  },
  components: { Window }
});

</script>

<style scoped>

/** === Main Window === */

.window-contents {
  display: flex;
  flex-direction: row;
  padding: 18px;
}

.node-id-field {
  width: 484px;
  height: 31px;
  font-family: "Roboto Mono", monospace;
  font-size: 9pt;
  padding: 10px;
  margin-right: 9px;
}
.node-id-field::placeholder {
  font-weight: 500;
}

.jump-button { 
  width: 85px;
  height: 31px;
}

</style>
