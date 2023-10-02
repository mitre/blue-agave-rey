<template>
  <Window class="about-window" title="About" @grab="onGrab" @close="onClose">
    <div class="about-information">
      <div class="logo-information">
        <ReyLogo class="logo" color="#b8b8b8" />
        <ReyWordmark class="wordmark" color="#b8b8b8" />
      </div>
      <div class="version-information">
        <p class="version">Version {{ version }}</p>
        <p class="agent">{{ agent }}</p>
      </div>
      <component v-if="ProductAttribution" :is="ProductAttribution" />
    </div>
  </Window>
</template>

<script lang="ts">
import Package from "@/../package.json";
import Features from "@/assets/rey.features";
// Dependencies
import { defineComponent, markRaw } from "vue";
// Components
import Window from "@/components/Containers/Window.vue";
import ReyLogo from "@/components/Icons/ReyLogo.vue";
import ReyWordmark from "@/components/Icons/ReyWordmark.vue";
// Feature Configurations
let ProductAttribution: any = null;
if(Features.application.product_attribution) {
  ProductAttribution = markRaw(
    Features.application.product_attribution as any
  );
}

export default defineComponent({
  name: "AboutWindow",
  data() {
    return {
      version: Package.version, 
      agent: navigator.userAgent,
      year: new Date().getFullYear(),
      ProductAttribution
    }
  },
  emits: ["grab", "close"],
  methods: {

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
    }

  },
  components: { Window, ReyLogo, ReyWordmark }
});
</script>

<style scoped>

/** === Main Window === */

.about-window {
  color: #b8b8b8;
}

.about-information {
  display: flex;
  flex-direction: column;
  padding: 30px 42px;
}

/** === Logo Info === */

.logo-information {
  display: flex;
  padding: 3px 0px;
}

.logo,
.wordmark {
  height: 28px;
}
.wordmark {
  margin-left: 11px;
}

/** === Version Info === */

.version-information {
  margin-top: 18px;
}

.version {
  font-size: 13.5pt;
  font-weight: 700;
  margin-bottom: 1px;
}

.agent {
  max-width: 392px;
  color: #999999;
  font-size: 9.5pt;
  font-weight: 500;
}

</style>
