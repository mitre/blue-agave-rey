<template>
  <Window 
    class="set-import-by-id-window" 
    title="Import Activity Set by ID..."
    @close="onClose"
    @grab="onGrab"
  >
    <div class="import-window">
      <input 
        type="text"
        ref="input"
        v-model="id"
        maxlength="64"
        class="activity-set-id-field"
        placeholder="Activity Set ID"
        @keyup="$event.key !== 'Enter' || importId()"
      />
      <button
        class="import-button"
        :disabled="!isIdValid"
        @click="importId"
      >
        Import
      </button>
    </div>
  </Window>
</template>

<script lang="ts">
// Dependencies
import { mapActions } from "vuex";
import { defineComponent, ref, type Ref } from "vue";
// Components
import Window from "@/components/Containers/Window.vue";

export default defineComponent({
  name: "SetImportByIdWindow",
  setup() {
    return {
      input: ref(null) as Ref<HTMLElement | null>
    }
  },
  data() {
    return {
      id: ""
    }
  },
  computed: {

    /**
     * Returns true if the Activity Set id is valid, false otherwise.
     * @returns
     *  True if the Activity Set id is valid, false otherwise.
     */
    isIdValid(): boolean {
      return /^[0-9a-f]{64}$/i.test(this.id);
    }

  },
  emits: ["grab", "close"],
  methods: {

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", ["openExceptionWindow"]),

    /**
     * Activity Set Importer actions
     */
    ...mapActions("ActivitySetImporter", ["importActivitySetFileById"]),

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
     * Imports the specified Activity Set.
     */
    async importId() {
      try {
        // Close window
        this.$emit("close");
        // Import id
        await this.importActivitySetFileById({ ids: this.id });
      } catch(ex) {
        this.openExceptionWindow({ ex, src: "<SetImportByIdWindow>" });
      }
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

.import-window {
  display: flex;
  flex-direction: row;
  padding: 18px;
}

.activity-set-id-field {
  width: 484px;
  height: 31px;
  font-family: "Roboto Mono", monospace;
  font-size: 9pt;
  padding: 10px;
  margin-right: 9px;
}
.activity-set-id-field::placeholder {
  font-weight: 500;
}

.import-button { 
  width: 85px;
  height: 31px;
}

</style>
