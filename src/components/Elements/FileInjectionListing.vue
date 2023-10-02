<template>
  <div class="file-injection-listing-element">
    <div class="file-injection-listing-header">
      <slot></slot>
    </div>
    <ScrollBox class="file-injection-listing-content">
      <div class="file" v-for="file of listing" :key="file.file_path">
        <div class="src">
          <p class="tag">src</p>
          <div class="icon">
            <FileIcon :file="file.file_path" />
          </div>
          <p class="path">{{ file.file_path }}</p>
        </div>
        <div class="dst">
          <p class="tag">dst</p>
          <div class="icon">
            <FileIcon :file="file.injection_path" />
          </div>
          <p class="path">{{ file.injection_path }}</p>
        </div>
      </div>
      <div class="no-files" v-if="listing.length === 0">
        None
      </div>
    </ScrollBox>
  </div>
</template>

<script lang="ts">
// Dependencies
import { defineComponent, PropType } from "vue";
import { ActivitySetArchiveFileInjection } from "@/assets/scripts/ViewData/ActivitySetFileTypes";
// Components
import FileIcon from "@/components/Elements/FileIcon.vue"
import ScrollBox from "@/components/Containers/ScrollBox.vue";

export default defineComponent({
  name: "FileInjectionListing",
  props: {
    listing: {
      type: Array as PropType<ActivitySetArchiveFileInjection[]>,
      required: true
    }
  },
  components: { FileIcon, ScrollBox }
});

</script>

<style scoped>

/** === Main Element === */

.file-injection-listing-element {
  border: solid 1px #383838;
  border-radius: 2px;
  overflow: hidden;
}

.file-injection-listing-header {
  display: flex;
  align-items: center;
  user-select: none;
  padding: 5px 8px;
  border-bottom: solid 1px #383838;
  background: #2b2b2b;
}

.file-injection-listing-content {
  max-height: 500px;
}

.file-injection-listing-content:deep(.scroll-bar) {
  border-left: solid 1px #383838;
}

/** === File Item === */

.file {
  padding: 6px 14px 6px 7px;
  border-bottom: solid 1px #383838;
}
.file:last-child {
  border-bottom: none;
}

.src, .dst {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.src {
  color: #a6a6a6;
}

.dst {
  margin-top: 5px;
}

.tag {
  width: 26px;
  color: #d9d9d9;
  font-size: 9pt;
  text-align: center;
  user-select: none;
  padding: 1px 0px;
  border-radius: 2px;
}

.src .tag {
  background: #404040;
}

.dst .tag {
  background: #525252;
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
  overflow: hidden;
}

/** === No Files Item === */

.no-files {
  color: #999999;
  font-style: italic;
  padding: 7px 10px;
}

</style>
