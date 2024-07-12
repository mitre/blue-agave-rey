<template>
  <div class="event-listing-panel" @contextmenu.stop>
    <div class="header">
      <div class="header-info" :style="{ borderColor: color }">
        <div class="title">
          {{ title }}
        </div>
        <div class="subtitle">
          {{ subtitle }}
        </div>
      </div>
    </div>
    <div class="field" v-for="[name, value] in fields" :key="name">
      <span class="name">
        {{ name }}
      </span>
      <template v-if="getListingType(value) !== null">
        <component class="value" :is="getListingType(value)" :listing="value" />
      </template>
      <span v-else :class="['value', getFormatType(name, value)]">
        {{ value }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import Features from "@/assets/rey.features"
// Dependencies
import { ColorMap } from "@/assets/scripts/Visualizations/VisualAttributeValues";
import { FillColorMask } from "@/assets/scripts/Visualizations/VisualAttributes";
import { titleCase, Regex } from "@/assets/scripts/String";
import { defineComponent, type PropType } from "vue";
import { ActivitySetAnalyticNode, type ActivitySetCommonNode } from "@/assets/scripts/ViewData/ViewNode";
// Components
import ArchiveListing from "@/components/Elements/ArchiveListing.vue";
// Feature Configurations
let code_types = new Set(Features.activity_set_event_listing.code_types);
let excluded_keys = new Set(Features.activity_set_event_listing.excluded_keys);

export default defineComponent({
  name: "EventListing",
  props: { 
    event: {
      type: Object as PropType<ActivitySetCommonNode>,
      required: true
    }
  },
  computed: {

    /**
     * Returns the listing's color.
     * @returns
     *  The listing's color.
     */
    color(): string {
      return ColorMap[this.event.style & FillColorMask]
    },

    /**
     * Returns the listing's title.
     * @returns
     *  The listing's title.
     */
    title(): string {
      let title;
      if(this.event instanceof ActivitySetAnalyticNode) {
        // Analytic: Return attack tactic
        title = this.event.data.attack_tactic;
      } else {
        // Event: Return CAR type
        title = `${
          this.event.getObjectTypeString()
        } ${
          this.event.getActionTypeString()
        }`
      }
      return titleCase(title);
    },

    /**
     * Returns the listing's subtitle.
     * @returns
     *  The listing's subtitle.
     */
    subtitle(): string {
      if(this.event instanceof ActivitySetAnalyticNode) {
        // Analytic: Return attack technique id
        return this.event.data.attack_technique_id;
      } else {
        // Event: Return first line of label
        return this.event.getLabel().split("\n")[0];
      }
    },

    /**
     * Returns the listing's fields.
     * @returns
     *  The listing's fields.
     */
    fields(): Map<string, string> {
      let fields = new Map<string, string>();
      let data: any = this.event.data;
      for(let key in data) {
        if(excluded_keys.has(key))
          continue;
        fields.set(key, data[key]);
      }
      return fields;
    }

  },
  methods: {
    
    /**
     * Gets a field's listing type, null if no listing type.
     * @param value
     *  The field's value.
     * @returns
     *  The field's listing type, null if no listing type.
     */
    getListingType(value: any) {
      switch(value.type) {
        case "archive-info":
          return ArchiveListing;
        default:
          return null;
      }
    },

    /**
     * Gets a field's format type.
     * @param key
     *  The field's key.
     * @param value
     *  The field's value.
     * @returns
     *  The field's format type.
     */
    getFormatType(key: string, value: any): "code" | "text" {
      if(value instanceof Object) {
        return "text"
      } else if(value.constructor.name === Number.name) {
        return "code";
      } else if(Regex.Uuid.test(value)) {
        return "code";
      }
      return code_types.has(key) ? "code" : "text";
    }

  }
});
</script>

<style scoped>

/** === Main Panel === */

.event-listing-panel {
  border: solid 1px #383838;
  border-radius: 3px;
  background: #242424;
  user-select: text;
  overflow: hidden;
}

/** === Header === */

.header {
  display: flex;
  flex-direction: row;
  padding: 8px 10px;
  border-bottom: solid 1px #383838;
  background: #2b2b2b;
}

.header-info {
  padding: 3px 10px;
  border-left: solid 6px;
}

.header-info .title {
  color: #d9d9d9;
  font-size: 15pt;
  font-weight: 700;
}

.header-info .subtitle {
  color: #999999;
  font-size: 10.5pt;
  font-weight: 600;
}

/** === Fields === */

.field {
  padding: 10px 0px;
  border-bottom: solid 1px #383838;
  margin: 0px 9px;
}
.field:last-child {
  border-bottom: none;
}

.field .name {
  display: block;
  color: #999999;
  font-size: 10pt;
  font-weight: 600;
  width: 100%;
  padding-left: 2px;
  box-sizing: border-box;
}

.field .value {
  display: block;
  color: #cccccc;
  font-size: 10.5pt;
  font-weight: 400;
  word-break: break-all;
  padding: 0px 7px 0px;
  margin-top: 7px;
}

.value.code {
  display: inline-block;
  color: #9e9e9e;
  font-size: 10pt;
  font-family: "Roboto Mono", monospace;
  padding: 3px 6px;
  border: solid 1px #121212;
  border-radius: 3px;
  margin: 7px 7px 0px;
  background: #1f1f1f;
}

</style>
