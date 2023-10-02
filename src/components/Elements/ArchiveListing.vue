<template>
  <div class="archive-listing-element">
    <FileListing class="list entries" :listing="listing.data.entries">
      <span></span><p>{{ listing.data.entries.length }} Entries</p>
    </FileListing>
    <FileInjectionListing class="list injected" :listing="listing.data.injected">
      <span></span><p>{{ listing.data.injected.length }} Injected</p>
    </FileInjectionListing>
    <FileListing class="list removed" :listing="listing.data.removed">
      <span></span><p>{{ listing.data.removed.length }} Removed</p>
    </FileListing>
  </div>
</template>

<script lang="ts">
// Dependencies
import { ActivitySetArchive } from "@/assets/scripts/ViewData/ActivitySetFileTypes";
import { defineComponent, PropType } from "vue";
// Components
import FileListing from "./FileListing.vue";
import FileInjectionListing from "./FileInjectionListing.vue"

export default defineComponent({
  name: "ArchiveListing",
  props: { 
    listing: {
      type: Object as PropType<ActivitySetArchive>,
      required: true
    }
  },
  components: { FileListing, FileInjectionListing }
});

</script>

<style scoped>

/** === Main Element === */

.list {
  margin-bottom: 12px;
}
.list:first-child {
  margin-top: 9px;
}
.list:last-child {
  margin-bottom: 2px;
}

/** === Section Titles === */

span, p {
  display: inline-block;
  color: #d9d9d9;
  font-size: 10pt;
  font-weight: 600;
}

span {
  font-size: 7.5pt;
  margin-right: 8px;
}

.entries span {
  color: #11b039;
}

.injected span {
  color: #a0d110;
}

.removed span {
  color: #ef5d5d;
}

</style>
