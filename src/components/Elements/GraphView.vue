<template>
  <div class="graph-view-element">
    <ContextMenu
      class="graph-context-menu"
      v-if="menu.show"
      :style="menuStyle"
      :sections="menuOptions"
      @select="onMenuItemSelect"
      @unfocus="closeContextMenu"
    />
  </div>
</template>

<script lang="ts">
import Features from "@/assets/rey.features";
import * as Store from "@/store/StoreTypes";
// Dependencies
import { MouseClick } from "@/assets/scripts/WebUtilities/WebTypes";
import { GenericViewItem } from "@/assets/scripts/Visualizations/ViewBaseTypes/GenericViewItem";
import { ActivitySetInfo } from "@/assets/scripts/ViewData/ActivitySetInfo";
import { NetworkReloadError } from "@/components/Exceptions/NetworkReloadError";
import { ForceDirectedNetwork } from "@/assets/scripts/Visualizations/ForceDirectedNetwork/ForceDirectedNetwork";
import { ActivitySetCommonNode } from "@/assets/scripts/ViewData/ViewNode";
import { ActivitySetCommonEdge } from "@/assets/scripts/ViewData/ViewEdge";
import { defineComponent, markRaw } from "vue";
import { mapActions, mapGetters, mapState } from "vuex";
// Components
import ContextMenu from "@/components/Controls/ContextMenu.vue";

export default defineComponent({
  name: "GraphView",
  props: {
    topCover: { 
      type: Number, 
      default: 0
    },
    leftCover: {
      type: Number,
      default: 0
    },
    rightCover: {
      type: Number,
      default: 0
    },
    bottomCover: {
      type: Number, 
      default: 0 
    }
  },
  data() {
    return {
      graph: markRaw(new ForceDirectedNetwork()),
      menu: {
        x: 0,
        y: 0,
        show: false,
      },
      nowFrozen: new Set<string>(),
    };
  },
  computed: {

    /**
     * Activity Sets Store data
     */
    ...mapState("ActivitySetsStore", {
      triggerDataLoaded(state: Store.ActivitySetsStore): number {
        return state.triggerDataLoaded;
      },
      triggerDataFocused(state: Store.ActivitySetsStore): number {
        return state.triggerDataFocused;
      },
      triggerDataDisplay(state: Store.ActivitySetsStore): number{
        return state.triggerDataDisplay;
      },
      triggerDataSelected(state: Store.ActivitySetsStore): number {
        return state.triggerDataSelected;
      },
      triggerNetworkLayout(state: Store.ActivitySetsStore): number {
        return state.triggerNetworkLayout;
      },
      triggerCamera(state: Store.ActivitySetsStore): number {
        return state.triggerCameraFocus;
      },
      sets(state: Store.ActivitySetsStore): Map<string, ActivitySetInfo> {
        return state.sets;
      },
      nodes(state: Store.ActivitySetsStore): Map<string, ActivitySetCommonNode> {
        return state.nodes;
      },
      edges(state: Store.ActivitySetsStore): Map<string, ActivitySetCommonEdge> {
        return state.edges;
      },
      selected(state: Store.ActivitySetsStore): Map<string, GenericViewItem> {
        return state.selected;
      }
    }),

    /**
     * Activity Set Network Store data
     */
    ...mapState("ActivitySetNetworkStore", {
      justFrozen(state: Store.ActivitySetNetworkStore): Set<string> {
        return state.frozen;
      },
    }),

    /**
     * App Settings Store data
     */
    ...mapState("AppSettingsStore", {
      clusters(state: Store.AppSettingsStore): Array<string> {
        return state.settings.view.graph.active_clustering_features;
      },
      renderHighQuality(state: Store.AppSettingsStore): boolean {
        return state.settings.view.graph.render_high_quality;
      },
      displayClusterInfo(state: Store.AppSettingsStore): boolean {
        return state.settings.view.graph.display_cluster_info;
      },
      multiSelectHotkey(state: Store.AppSettingsStore) {
        return {
          hotkey: state.settings.keybindings.selection.multi_select,
          strict: false,
        };
      },
      tracebackHotKey(state: Store.AppSettingsStore) {
        return {
          hotkey: state.settings.keybindings.selection.traceback,
          strict: false,
        };
      },
    }),

    /**
     * Context Menu Store data
     */
    ...mapGetters("ContextMenuStore", [
      "graphViewSubmenu",
      "itemSelectionSubmenu",
      "massSelectionMenuSection",
    ]),

    /**
     * Returns the graph's context menu options.
     * @returns
     *  The graph's context menu options.
     */
    menuOptions(): Store.ContextMenuSection[] {
      if (this.selected.size > 0) {
        return this.itemSelectionSubmenu.sections;
      } else {
        return [
          this.massSelectionMenuSection,
          ...this.graphViewSubmenu.sections
        ];
      }
    },

    /**
     * Returns the context menu's styling.
     * @returns
     *  The context menu's styling.
     */
    menuStyle(): { top: string; left: string } {
      return {
        top: `${this.menu.y}px`,
        left: `${this.menu.x}px`,
      };
    }

  },
  methods: {

    /**
     * Activity Sets Store actions
     */
    ...mapActions("ActivitySetsStore", [
      "selectItem",
      "unselectAll",
      "selectTraceback",
    ]),

    /**
     * Context Menu Store actions
     */
    ...mapActions("ContextMenuStore", ["selectMenuItem"]),

    /**
     * Hotkey Store actions
     */
    ...mapActions("HotkeyStore", ["isHotkeyActive"]),

    /**
     * Window Manager Store actions
     */
    ...mapActions("WindowManagerStore", ["openExceptionWindow"]),

    /**
     * Node click behavior.
     * @param event
     *  The pointer event.
     * @param node
     *  The node that was clicked.
     * @param x
     *  The click event's x coordinate (relative to the graph container).
     * @param y
     *  The click event's y coordinate (relative to the graph container).
     */
    async onNodeClick(
      event: PointerEvent, node: ActivitySetCommonNode, x: number, y: number
    ) {
      if (
        !(await this.isHotkeyActive(this.multiSelectHotkey)) &&
        !node.isSelected()
      ) {
        this.unselectAll();
      }
      if (await this.isHotkeyActive(this.tracebackHotKey)) {
        this.selectTraceback(node.id);
      } else {
        this.selectItem(node.id);
      }
      if (event.button === MouseClick.Right) {
        this.openContextMenu(x, y);
      }
    },

    /**
     * Canvas click behavior.
     * @param event
     *  The pointer event.
     * @param x
     *  The click event's x coordinate (relative to the graph container).
     * @param y
     *  The click event's y coordinate (relative to the graph container).
     */
    async onCanvasClick(event: PointerEvent, x: number, y: number) {
      if (await this.isHotkeyActive(this.tracebackHotKey)) {
        this.unselectAll();
      }
      if (event.button === MouseClick.Right) {
        this.unselectAll();
        this.openContextMenu(x, y);
      } else {
        this.closeContextMenu();
      }
    },

    /**
     * Context menu item selection behavior.
     * @param id
     *  The id of the selected menu item.
     * @param data
     *  Auxillary data included with the selection.
     */
    onMenuItemSelect(id: string, data: any) {
      this.selectMenuItem({ id, data });
      this.closeContextMenu();
    },

    /**
     * Opens the context menu.
     * @param x
     *  The menu's x coordinate (relative to the graph container).
     * @param y
     *  The menu's y coordinate (relative to the graph container).
     */
    openContextMenu(x: number, y: number) {
      // Allow unfocus event to run first (if context
      // menu is already present) then show context menu.
      requestAnimationFrame(() => {
        this.menu.show = true;
        this.menu.x = x;
        this.menu.y = y;
      })
    },

    /**
     * Closes the context menu.
     */
    closeContextMenu() {
      this.menu.show = false;
    },

    /**
     * Completely reloads the Activity Set graph.
     */
    async reloadNodesAndEdges() {
      try {
        let triggerCamera = this.selected.size > 0;
        // Reload graph
        this.graph.setNodesAndEdges(
          markRaw([...this.nodes.values()]), 
          markRaw([...this.edges.values()]),
          triggerCamera
        );
        // Reapply freeze state after simulation end
        await this.graph.waitForSimulationEnd();
        for (let id of this.justFrozen)
          this.graph.freezeNode(id);
        this.nowFrozen = new Set(this.justFrozen);
        // Move camera to selection
        if(triggerCamera) {
            let ids = [...this.selected.keys()];
            this.graph.moveCameraToNode(ids, {
                t: this.topCover,
                l: this.leftCover,
                r: this.rightCover,
                b: this.bottomCover,
            }, true);
        }
      } catch(ex: any) {
        this.openExceptionWindow({
          ex: new NetworkReloadError(ex),
          src: "<GraphView>"
        });
      }
    }

  },
  watch: {
    // On data loaded trigger
    triggerDataLoaded() {
      this.reloadNodesAndEdges();
    },
    // On data focused trigger
    triggerDataFocused() {
      this.graph.refreshAppearances();
      this.graph.render();
    },
    // On data display trigger
    triggerDataDisplay() {
      this.graph.refreshAppearances();
      this.graph.render();
    },
    // On data selected trigger
    triggerDataSelected() {
      this.graph.refreshAppearances();
      this.graph.render();
    },
    // On network layout trigger
    triggerNetworkLayout() {
      try {
        this.graph.runLayout();
      } catch(ex: any) {
        this.openExceptionWindow({
          ex: new NetworkReloadError(ex),
          src: "<GraphView>"
        });
      }
    },
    // On camera trigger
    triggerCamera() {
      let ids = [...this.selected.keys()];
      this.graph.moveCameraToNode(ids, {
          t: this.topCover,
          l: this.leftCover,
          r: this.rightCover,
          b: this.bottomCover,
      });
    },
    // On render quality change
    renderHighQuality(value: boolean) {
      this.graph.setSsaaScale(value ? 2 : 1);
      this.graph.render();
    },
    // On display cluster info change
    displayClusterInfo(value: boolean) {
      this.graph.setClusterInfoVisibility(value);
      this.graph.render();
    },
    // On cluster change
    clusters: {
      handler(value: string[]) {
        try {
          this.graph.setCluster([...value]);
          this.graph.runLayout();
        } catch(ex: any) {
          this.openExceptionWindow({
            ex: new NetworkReloadError(ex),
            src: "<GraphView>"
          });
        }
      },
      deep: true,
    },
    // On frozen change
    justFrozen: {
      handler() {
        for (let id of this.nowFrozen) this.graph.unfreezeNode(id);
        for (let id of this.justFrozen) this.graph.freezeNode(id);
        this.nowFrozen = new Set(this.justFrozen);
      },
      deep: true,
    },
  },
  async mounted() {

    // Style graph
    let RobotoMonoClass = { 
      family: "Roboto Mono", 
      weight: 600
    };
    let RobotoMonoLabel = { 
      lineHeight: 42,
      family: "Roboto Mono", 
      weight: 500, 
      size: "26px"
    }
    await this.graph.setNetworkStyle({
      backgroundColor: "#1a1a1a",
      boundingCornerColor: "#808080",
      nodeLabelFont: {
        lineHeight: 11,
        family: "Barlow", 
        weight: 600,
        color: "#e6e6e6",
        size: "9px" 
      },
      textFormatFonts: {
        class_Benign_l    : { ...RobotoMonoClass, size: "42px", color: "#33b85b" },
        class_Benign_s    : { ...RobotoMonoClass, size: "30px", color: "#33b85b" },
        class_Malicious_l : { ...RobotoMonoClass, size: "42px", color: "#ff4747"},
        class_Malicious_s : { ...RobotoMonoClass, size: "30px", color: "#ff4747"},
        feature           : { ...RobotoMonoLabel, color: "#808080" },
        highlight         : { ...RobotoMonoLabel, color: "#a6a6a6", }
      } 
    });

    // Set cluster format function
    this.graph.setClusterInfoFormatter(features => {
      // Compile features
      let text = ""
      if(0 < this.clusters.length) {
        for(let f of this.clusters) {
          let value = features.get(f)?.values().next().value;
          if(value !== undefined) {
            text += `, ${ f }: <highlight>${ value }<feature>`;
          } else {
            text += `, Error: Unknown feature '${ f }'`
          }
        }
        text = `<feature>[${ text.substring(2) }]`
      }
      // Compile classification
      if(Features.classification.enable_activity_set_classification) {
        let scores = [...features.get("__set")!]
          .map(id => this.sets.get(id as string)?.score.value ?? 0)
        let min = Math.min(...scores);
        let max = Math.min(...scores);
        let s = max < 0.5 ? "Benign" : "Malicious"
        let score = min === max ? `${ min }%` : `${ min }%-${ max }%`;
        text = `<class_${ s }_l>${ s }<class_${ s }_s>\n${ text }`;
      }
      // Return text
      return text;
    });

    // Subscribe to graph events
    this.graph.on("node-click", (e, n, x, y) =>
      this.onNodeClick(e, n as ActivitySetCommonNode, x, y)
    );
    this.graph.on("canvas-click", (e, x, y) => 
      this.onCanvasClick(e, x, y)
    );

    // Configure SSAA
    this.graph.setSsaaScale(this.renderHighQuality ? 2 : 1);
    // Configure cluster info visibility
    this.graph.setClusterInfoVisibility(this.displayClusterInfo);
    // Configure clusters
    this.graph.setCluster([...this.clusters]);
    
    // Inject and load graph
    try {
      this.graph.inject(this.$el);
    } catch(ex: any) {
      this.openExceptionWindow({
        ex: new NetworkReloadError(ex),
        src: "<GraphView>"
      });
    }
    this.reloadNodesAndEdges();
    
  },
  unmounted() {
    this.graph.destroy();
  },
  components: { ContextMenu }
});
</script>

<style scoped>

/** === Main Element === */

.graph-view-element {
  position: relative;
}

.graph-context-menu {
  position: absolute;
}

</style>
