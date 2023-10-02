<template>
  <div class="product-attribution-panel">
    <div class="author-information">
      <p class="author">Michael Carenzo</p>
      <p class="email">mcarenzo@mitre.org</p>
    </div>
    <div class="copyright">
      © {{ year }} The MITRE Corporation. All Rights Reserved.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ProductAttribution",
  data() {
    return {
      year: new Date().getFullYear()
    }
  }
});

</script>

<style scoped>

/** === Author Info === */

.author-information {
  margin-top: 16px;
}

.author {
  font-size: 11pt;
  font-weight: 600;
}
.email {
  color: #999999;
  font-size: 9.5pt;
  font-weight: 500;
}

/** === Copyright Info === */

.copyright {
  font-size: 9.5pt;
  font-weight: 500;
  margin-top: 18px;
}

</style>
