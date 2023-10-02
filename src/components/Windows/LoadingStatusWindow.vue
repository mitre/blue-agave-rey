<template>
  <Window class="loading-status-window" @grab="onGrab" :canClose="false" v-slot="{ title, subtitle }">
    <div class="status-window">
      <SpinLoader class="loader" :size="35"/>
      <div class="loading-information">
        <p class="title">{{ title }}</p>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
    </div>
  </Window>
</template>

<script lang="ts">
// Dependencies
import { defineComponent } from "vue";
// Components
import Window from "@/components/Containers/Window.vue";
import SpinLoader from "@/components/Icons/SpinLoader.vue";

export default defineComponent({
  name: "LoadingStatusWindow",
  emits: ["grab"],
  methods: {

    /**
     * Window drag behavior.
     * @param event
     *  The pointer event.
     */
    onGrab(event: PointerEvent) {
      // Forward drag event from window component
      this.$emit("grab", event);
    }

  },
  components: { Window, SpinLoader }
});
</script>

<style scoped>

/** === Main Window === */

.loading-status-window {
  color: #b8b8b8;
}

.status-window {
  display: flex;
  align-items: center;
  padding: 18px 26px 18px 18px;
}

/** === Loading Info === */

.loader {
  margin-right: 15px;
}

.title  {
  font-size: 12pt;
  font-weight: 600;
}

.subtitle {
  color: #999999;
  font-size: 10pt;
  font-weight: 500;
}

</style>
