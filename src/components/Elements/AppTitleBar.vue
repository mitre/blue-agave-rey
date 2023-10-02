<template>
  <TitleBar class="app-title-bar-element" :menus="menus" @select="onItemSelect">
    <template v-slot:icon>
      <ReyLogo class="logo" color="#f95939" />
    </template>
  </TitleBar>
</template>

<script lang="ts">
import * as Store from "@/store/StoreTypes";
// Dependencies
import { defineComponent } from "vue";
import { mapActions, mapGetters } from "vuex";
// Components
import ReyLogo from "@/components/Icons/ReyLogo.vue";
import TitleBar from "@/components/Controls/TitleBar.vue";

export default defineComponent({
  name: "AppTitleBar",
  computed: {

    /**
     * Context Menu Store data
     */
    ...mapGetters("ContextMenuStore", [
      "timeMenu",
      "viewMenu",
      "helpMenu",
      "fileMenu",
      "selectionMenu"
    ]),
    
    /**
     * Returns the application's menus.
     * @returns
     *  The application's menus.
     */
    menus(): Store.ContextMenuItem[] {
      return [
        this.fileMenu, 
        this.selectionMenu,
        this.timeMenu,
        this.viewMenu,
        this.helpMenu
      ].filter(o => o !== null) as Store.ContextMenuItem[];
    }

  },
  methods: {

    /**
     * Context Menu Store actions
     */
    ...mapActions("ContextMenuStore", ["selectMenuItem"]),

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", ["openExceptionWindow"]),

    /**
     * Menu item selection behavior.
     * @param id
     *  The id of the selected menu item.
     * @param data
     *  Auxillary data included with the selection.
     */
    async onItemSelect(id: string, data: any) {
			try {
				await this.selectMenuItem({ id, data });
			} catch(ex: any) {
				this.openExceptionWindow({ 
					ex, src: "<AppTitleBar>"
				});
			}
    }

  },
  components: { ReyLogo, TitleBar }
});
</script>

<style scoped>

/** === App Logo === */

.logo {
  height: 10px;
  margin: 0px 7px;
}

</style>
