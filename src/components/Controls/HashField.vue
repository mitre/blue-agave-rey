<template>
  <div
    :class="['hash-field-control', { enabled: hash.length }]"
    @mouseover="hovered = hash.length !== 0"
    @mouseout="hovered = false"
    @click="copyToClipboard"
  >
    <div class="hash-substring" :style="{ width }">
      <transition mode="out-in">
        <span v-if="!showMessage">
          {{ hash.substring(0, length) || "—" }}
        </span>
        <span v-else class="copy-message">
          Copied
        </span>
      </transition>
    </div>
    <div class="copy-button">
      <CopyIcon :color="!showMessage && hovered ? '#f2f2f2' : '#7a7a7a'" />
    </div>
  </div>
</template>

<script lang="ts">
// Dependencies
import { defineComponent } from 'vue';
// Components
import CopyIcon from "@/components/Icons/CopyIcon.vue";

export default defineComponent({
  name: 'HashField',
  props: {
    hash: {
      type: String,
      default: ""
    },
    length: {
      type: Number,
      default: 8
    },
    width: {
      type: String,
      default: "80px"
    }
  },
  data() {
    return {
      hovered: false,
      showMessage: false
    }
  },
  methods: {
    
    /**
     * Copies the hash to the clipboard.
     */
    async copyToClipboard() {
      if(this.hash) {
        this.showMessage = true;
        await navigator.clipboard.writeText(this.hash);
        await new Promise(r => setTimeout(r, 1500));
        this.showMessage = false;
      }
    }

  },
  components: { CopyIcon }
});

</script>

<style scoped>

/** === Main Control === */

.hash-field-control {
  display: flex;
  align-items: center;
  color: #a8a8a8;
  font-size: 9.3pt;
  font-family: "Roboto Mono", monospace;
  user-select: none;
  border-left: solid 1px #383838;
  background: #1f1f1f;
}

.hash-field-control.enabled {
  cursor: pointer;
}
.hash-field-control.enabled:hover {
  color: #f2f2f2;
}

/** === Field === */

.hash-substring {
  text-align: center;
}

.copy-button {
  padding: 0px 7px;
  border-left: solid 1px #383838;
}

.copy-message {
  color: #f2f2f2;
  font-size: 9pt;
  font-weight: 600;
  font-family: "Inter", sans-serif;
}

/** === Animations === */

.v-enter-active,
.v-leave-active {
  transition: opacity 0.10s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

</style>
