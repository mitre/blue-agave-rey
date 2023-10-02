<template>
  <div class="file-listing-element">
    <div class="file-listing-header">
      <slot></slot>
    </div>
    <ScrollBox class="file-listing-content">
      <div class="file" v-for="file of listing" :key="file.file_path">
        <div class="icon">
          <FileIcon :file="file.file_path" />
        </div>
        <p class="path">
          {{ file.file_path }}
        </p>
        <HashField class="hash" :hash="file.SHA256" />
      </div>
      <div class="no-files" v-if="listing.length === 0">
        None
      </div>
    </ScrollBox>
  </div>
</template>

<script lang="ts">
// Dependencies
import { ActivitySetArchiveFile } from "@/assets/scripts/ViewData/ActivitySetFileTypes";
import { defineComponent, PropType } from "vue";
// Components
import FileIcon from "@/components/Elements/FileIcon.vue"
import HashField from "@/components/Controls/HashField.vue";
import ScrollBox from "@/components/Containers/ScrollBox.vue";

export default defineComponent({
  name: "FileListing",
  props: {
    listing: {
      type: Array as PropType<ActivitySetArchiveFile[]>,
      required: true
    }
  },
  components: { FileIcon, HashField, ScrollBox }
});

</script>

<style scoped>

/** === Main Element === */

.file-listing-element {
  border: solid 1px #383838;
  border-radius: 2px;
  overflow: hidden;
}

.file-listing-header {
  display: flex;
  align-items: center;
  user-select: none;
  padding: 5px 8px;
  border-bottom: solid 1px #383838;
  background: #2b2b2b;
}

.file-listing-content {
  max-height: 500px;
}

.file-listing-content:deep(.scroll-bar) {
  border-left: solid 1px #383838;
}

/** === File Item === */

.file {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 24px;
  border-bottom: solid 1px #383838;
  box-sizing: border-box;
}
.file:last-child {
  border-bottom: none;
}

.icon {
  width: 23px;
  text-align: center;
}

.path {
  flex: 1;
  direction: rtl;
  font-size: 10pt;
  text-align: left;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-right: 14px;
  overflow: hidden;
}

.hash {
  height: 100%;
}

/** === No Files Item === */

.no-files {
  color: #999999;
  font-style: italic;
  padding: 7px 10px;
}

</style>
