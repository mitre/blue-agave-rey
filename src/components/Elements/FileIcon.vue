<template>
  <component :is="getFileIcon(file)" :color="color" />
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
// Dependencies
import { mapState } from "vuex";
import { defineComponent } from 'vue';
// Components
import FileIconText from "@/components/Icons/FileIconText.vue";
import FileIconImage from "@/components/Icons/FileIconImage.vue";
import FileIconAudio from "@/components/Icons/FileIconAudio.vue";
import FileIconVideo from "@/components/Icons/FileIconVideo.vue";
import FileIconBinary from "@/components/Icons/FileIconBinary.vue";
import FileIconArchive from "@/components/Icons/FileIconArchive.vue";
import FileIconExecutable from "@/components/Icons/FileIconExecutable.vue";
import FileIconSpreadsheet from "@/components/Icons/FileIconSpreadsheet.vue";

export default defineComponent({
  name: "FileIcon",
  props: {
    file: {
      type: String,
      default: ""
    },
    color: {
      type: String,
      default: "#a3a3a3"
    }
  },
  computed: {
    
    /**
     * App Settings Store data
     */
    ...mapState<any, {
      fileClasses: (state: Store.AppSettingsStore) => Store.FileTypeClasses
    }>("AppSettingsStore", {
      fileClasses(state: Store.AppSettingsStore): Store.FileTypeClasses {
        return state.settings.file_classes;
      },
    })

  },
  methods: {
    
    /**
     * Gets a file's icon.
     * @param file
     *  The file's name.
     * @returns
     *  The file's icon.
     */
    getFileIcon(file: string) {
      switch(this.getFileClass(file)) {
        case "text":
          return FileIconText;
        case "image":
          return FileIconImage;
        case "audio":
          return FileIconAudio;
        case "video":
          return FileIconVideo;
        case "archive":
          return FileIconArchive;
        case "executable":
          return FileIconExecutable;
        case "spreadsheet":
          return FileIconSpreadsheet;
        default:
          return FileIconBinary;
      }
    },

    /**
     * Gets a file's class.
     * @param file
     *  The file's name.
     * @returns
     *  The file's class.
     */
    getFileClass(file: string): string {
      
      // If no file extension
      if(file.indexOf(".") === -1)
        return "binary";

      // If file extension
      for(let type in this.fileClasses) {
        let classes = this.fileClasses[type as keyof Store.FileTypeClasses];
        for(let i = file.indexOf("."); i !== -1; i = file.indexOf(".", i + 1)) {
          if(classes.has(file.substring(i + 1)))
            return type;
        }
      }
      return "binary";
    
    }

  }
});

</script>
