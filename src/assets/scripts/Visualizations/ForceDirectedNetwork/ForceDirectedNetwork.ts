import * as d3 from "d3";
import { Device } from "../../WebUtilities/Device";
import { GraphEdge } from "./GraphEdge";
import { GraphNode } from "./GraphNode";
import { Primitive } from "../../HelperTypes";
import { MouseClick } from "@/assets/scripts/WebUtilities/WebTypes";
import { GraphCluster } from "./GraphCluster";
import { EventEmitter } from "../EventEmitter";
import { isInsideShape } from "../../Math";
import { FontDescriptor } from "../Fonts";
import { GenericViewEdge } from "../ViewBaseTypes/GenericViewEdge";
import { GenericViewNode } from "../ViewBaseTypes/GenericViewNode";
import { NodeRasterCache } from "./NodeRasterCache";
import { ClusterRasterCache } from "./ClusterRasterCache";
import { LinkColorMap, LinkStyleMap, SizeMap } from "../VisualAttributeValues";
import { findLayerSegments, getVisualPriority as gvp } from "../Layers";
import { resizeAndTransformContext, resizeContext, transformContext } from "../Canvas";
import { 
    SizeMask, 
    LinkStyleMask,
    FillColorMask,
    Stroke1ColorMask, 
} from "../VisualAttributes";

export class ForceDirectedNetwork extends EventEmitter<GraphEvents> {
    
    private static readonly VIEWPORT_PADDING = 150;
    private static readonly RASTER_CACHE_UPDATE_DELAY = 100;

    // Force Directed Network Fields
    private _$: NetworkStyle;
    private _zoom: CanvasZoomBehavior | null;
    private _rafId: number;
    private _canvas: CanvasSelection | null;
    private _context: CanvasRenderingContext2D | null
    private _elWidth: number;
    private _elHeight: number;
    private _viewport: number[]
    private _movement: { end: Promise<void>, res: Function, resolved: boolean };
    private _transform: any;
    private _simulation: d3.Simulation<GraphNode, GraphEdge>;
    private _renderMode: RenderMode;
    private _zoomTimeoutId: number | undefined;
    private _nodeRasterCache: NodeRasterCache;
    private _onResizeObserver: ResizeObserver | null;
    private _clusterRasterCache: ClusterRasterCache;
    
    // Data Fields
    private _layers: GraphLayers;
    private _nodes: GraphNode[];
    private _weakEdges: GraphEdge[];
    private _strongEdges: GraphEdge[];
    private _clusters: GraphCluster[];
    private _nodeIndex: Map<string, GraphNode>;
    private _edgeIndex: Map<string, GraphEdge>;
    private _ssaaScale: number;
    private _showClusterInfo: boolean;
    private _clusterFeatures: string[];
    private _formatClusterInfo: (features: ClusterFeatureSet) => string;


    /**
     * Creates a new ForceDirectedNetwork.
     */
    constructor() {
        super();

        // Setup graph state
        this._zoom = null;
        this._rafId = 0;
        this._elWidth = 0;
        this._elHeight = 0;
        this._canvas = null;
        this._context = null;
        this._viewport = [0, 0, 0, 0];
        this._transform = d3.zoomIdentity;
        this._renderMode = RenderMode.None;
        this._zoomTimeoutId = undefined;
        this._nodeRasterCache = new NodeRasterCache();
        this._clusterRasterCache = new ClusterRasterCache();
        this._onResizeObserver = null;
        this._movement = { end: Promise.resolve(), res: () => {}, resolved: true };
        this.declareMovement();
        
        // Setup data state
        this._layers = {
            nMajor  : [],
            weMajor : [],
            weMinor : [],
            seMajor : [],
            seMinor : []
        };
        this._nodes = [];
        this._weakEdges = [];
        this._strongEdges = [];
        this._clusters = [];
        this._nodeIndex = new Map();
        this._edgeIndex = new Map();
        this._ssaaScale = 1;
        this._showClusterInfo = true;
        this._clusterFeatures = [];
        this._formatClusterInfo = () => "<default>No Cluster Format Function",

        // Prepare layers
        this.relayer();

        // Set viewport
        this.recalculateViewportBounds();

        // Setup physics simulation
        this._simulation = d3.forceSimulation<GraphNode, GraphEdge>()
            .velocityDecay(0.2)
            .force("link", d3.forceLink<GraphNode, GraphEdge>().id(d => d.id)
                .distance(d => d.obj.length).strength(1))
            .force("charge", d3.forceManyBody().strength(-200))
            .force('x', d3.forceX(0).strength(0.015))  // X Gravity
            .force('y', d3.forceY(0).strength(0.015))  // Y Gravity
            .alphaTarget(0)
            .alphaDecay(0.05)
            .on("end", () => {
                for (let node of this._nodes) {
                    node.x = Math.round(node.x!);
                    node.y = Math.round(node.y!);
                }
                this.render();
                this._movement.res();
            })
            .stop();

        // Set default style
        this._$ = {
            backgroundColor: "#1a1a1a",
            boundingCornerColor: "#808080",
            nodeLabelFont: { 
                lineHeight: 11,
                family: "sans-serif", 
                weight: 600,
                color: "#e6e6e6",
                size: "9px", 
            },
            textFormatFonts: {
                default: {
                    lineHeight: 14,
                    family: "sans-serif", 
                    weight: 600,
                    color: "#808080",
                    size: "30px", 
                }
            }
        }
        this.setNetworkStyle(this._$);

    }


    ///////////////////////////////////////////////////////////////////////////
    //  1. Inject, Destroy, and Configuration  ////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Injects the graph into a container.
     * @param container
     *  The container to inject the graph into.
     * @returns
     *  The ForceDirectedNetwork.
     * @throws { MissingFontStyleError }
     *  If any of the cluster labels reference a font style not defined in
     *  `textFormatFonts`.
     */
    public inject(container: HTMLElement): ForceDirectedNetwork {

        // Set sizing
        this._elWidth = container.clientWidth;
        this._elHeight = container.clientHeight;

        // Update viewport
        this.recalculateViewportBounds();

        // Setup canvas & context
        this._canvas = d3.select(container)
            .append("canvas")
                .attr("style", "display:block;")
            .on("contextmenu", (e: any) => e.preventDefault());
        this._context = this._canvas.node()!.getContext("2d", { alpha: false });

        // Size context
        resizeContext(this._context!, this._elWidth, this._elHeight);

        // Configure resize observer
        this._onResizeObserver = new ResizeObserver(
            entries => this.onCanvasResize(entries[0].target)
        );
        this._onResizeObserver.observe(container);

        // Configure zoom behavior
        this._zoom = d3.zoom<HTMLCanvasElement, unknown>()
            .scaleExtent([1 / 10, 6])
            .on("zoom", this.onCanvasZoomed.bind(this));

        // Configure dppx change behavior
        Device.on("dppx-change", this.onDevicePixelRatioChange, this);

        // Configure canvas interactions
        this._canvas
            .call(d3.drag<HTMLCanvasElement, unknown>()
                .filter(() => true)
                .subject(this.onSelectSubject.bind(this))
                .on("start", this.onNodeDragStarted.bind(this))
                .on("drag", this.onNodeDragged.bind(this))
                .on("end", this.onNodeDragEnded.bind(this))
            ).call(this._zoom);

        // Pan canvas to center
        let xCenterOffset = container.clientWidth / 2;
        let yCenterOffset = container.clientHeight / 2;
        this._canvas.call(this._zoom.translateBy, xCenterOffset, yCenterOffset);
        
        // Run layout
        this.runLayout();

        // Return ForceDirectedNetwork
        return this;
    }

    /**
     * Removes the graph from the container and removes all event listeners.
     * @returns
     *  The ForceDirectedNetwork.
     */
    public destroy(): ForceDirectedNetwork {
        this.switchRenderMode(RenderMode.None);
        this._zoom = null;
        this._canvas?.remove();
        this._canvas = null;
        this._context = null;
        this.removeAllListeners("node-click");
        this.removeAllListeners("canvas-click");
        this._onResizeObserver?.disconnect();
        Device.removeEventListenersWithContext(this);
        return this;
    }

    /**
     * Sets the graph's styling.
     * @param style
     *  The graph's style parameters.
     * @returns
     *  A Promise that resolves with the ForceDirectedNetwork once the styling
     *  has been applied.
     */
    public async setNetworkStyle(style: NetworkStyle): Promise<ForceDirectedNetwork> {
        let fonts = [];
        // Update style
        this._$ = style;
        // Update node font
        this._nodeRasterCache.clear();
        fonts.push(this._nodeRasterCache.setLabelFont(this._$.nodeLabelFont));
        // Update cluster raster cache fonts
        this._clusterRasterCache.clear();
        let tff = this._$.textFormatFonts;
        for(let name in tff) {
            fonts.push(this._clusterRasterCache.registerFont(name, tff[name]));
        }
        await Promise.all(fonts);
        return this;
    }

    /**
     * Sets the function used internally to format cluster features.
     * @param formatter
     *  A function that formats cluster features as a stylized string.
     * @returns
     *  The ForceDirectedNetwork.
     */
    public setClusterInfoFormatter(
        formatter: (features: ClusterFeatureSet) => string
    ): ForceDirectedNetwork {
        this._formatClusterInfo = formatter;
        return this;
    }

    /**
     * Sets the graph's supersampling anti-aliasing (SSAA) level.
     * @param k
     *  The supersampling scale.
     * @returns
     *  The ForceDirectedNetwork.
     */
    public setSsaaScale(k: number): ForceDirectedNetwork {
        this._ssaaScale = k;
        this._nodeRasterCache.scale(this._transform.k * this._ssaaScale);
        this._clusterRasterCache.scale(this._transform.k * this._ssaaScale);
        return this;
    }

    /**
     * Hides / Shows cluster information.
     * @param visible
     *  [true]
     *   Cluster information will be shown.
     *  [false]
     *   Cluster information will be hidden.
     * @returns
     *  The ForceDirectedNetwork.
     */
    public setClusterInfoVisibility(visible: boolean): ForceDirectedNetwork {
        this._showClusterInfo = visible;
        return this;
    }

    /**
     * Sets the features that should be clustered on.
     * @param features
     *  The features to cluster on.
     * @returns
     *  The ForceDirectedNetwork. 
     */
     public setCluster(features: string[]): ForceDirectedNetwork {
        this._clusterFeatures = features;
        return this;
    }

    /**
     * Freezes a node in place. When frozen, a node will stay put unless moved
     * by the user.
     * @param id
     *  The id of the node to freeze.
     * @returns
     *  The ForceDirectedNetwork.
     */
    public freezeNode(id: string): ForceDirectedNetwork {
        let node = this._nodeIndex.get(id);
        if(node) {
            node.isFrozen = true;
            node.fx = node.x;
            node.fy = node.y;
        }
        return this;
    }

    /**
     * Unfreezes a node. When unfrozen, a node will travel with the other nodes.
     * @param id
     *  The id of the node to unfreeze.
     * @returns
     *  The ForceDirectedNetwork.
     */
    public unfreezeNode(id: string): ForceDirectedNetwork {
        let node = this._nodeIndex.get(id);
        if(node) {
            node.isFrozen = false;
            node.fx = undefined;
            node.fy = undefined;
        }
        return this;
    }


    ///////////////////////////////////////////////////////////////////////////
    //  2. Rendering  /////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Moves the camera over to a node.
     * @param id
     *  The id of the node to focus on.
     * @param focus
     *  The canvas's focus region. If the canvas is obscured on any of its
     *  sides, this parameter enables the camera to center within the
     *  non-obscured subregion.
     *  [l] Left cover (px).
     *  [t] Top cover (px).
     *  [r] Right cover (px).
     *  [b] Bottom cover (px).
     *  (Default: { l:0, t:0, r:0, b: 0 })
     * @param wait
     *  If true, the camera will wait until all node movement stops.
     *  (Default: false)
     * @param time
     *  The animation duration in milliseconds.
     *  (Default: 1000)
     * @returns
     *  A Promise that resolves once the requested camera movement completes.
     */
    public moveCameraToNode(id: string, 
        focus?: CanvasFocusRegion, wait?: 
        boolean, duration?: number
    ): Promise<void>;

    /**
     * Moves the camera over a set of nodes.
     * @param ids
     *  The ids of the nodes to focus on.     
     * @param focus
     *  The canvas's focus region. If the canvas is obscured on any of its
     *  sides, this parameter enables the camera to center within the
     *  non-obscured subregion.
     *  [l] Left cover (px).
     *  [t] Top cover (px).
     *  [r] Right cover (px).
     *  [b] Bottom cover (px).
     *  (Default: { l:0, t:0, r:0, b: 0 })
     * @param wait
     *  If true, the camera will wait until all node movement stops.
     *  (Default: false)
     * @param duration
     *  The animation duration in milliseconds.
     *  (Default: 1000)
     * @returns
     *  A Promise that resolves once the requested camera movement completes.
     */
    public moveCameraToNode(
        ids: string[], focus?: CanvasFocusRegion, 
        wait?: boolean, duration?: number): Promise<void>;
    public moveCameraToNode(
        ids: string[] | string, focus?: CanvasFocusRegion, 
        wait: boolean = false, duration: number = 1000
    ): Promise<void> {
        return new Promise<void>(async (res) => {
            if(!Array.isArray(ids))
                ids = [ids];
            if(!focus)
                focus = { l: 0, t: 0, r: 0, b: 0 };
            if(this._zoom === null)
                return res()
            if(wait) await this._movement.end;
            // Calculate bounding box
            let node;
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            for(let id of ids){
                if(
                    !( node = this._nodeIndex.get(id) ) 
                    || node.x === undefined 
                    || node.y === undefined
                ) continue;
                minX = Math.min(minX, node.x! - node.radius);
                minY = Math.min(minY, node.y! - node.radius);
                maxX = Math.max(maxX, node.x! + node.radius);
                maxY = Math.max(maxY, node.y! + node.radius);
            }
            // Return if no nodes were resolved
            if(minX === Infinity) {
                return res();
            }
            // Calculate canvas's true width and height
            let width = this._elWidth - focus.l - focus.r;
            let height = this._elHeight - focus.t - focus.b;
            // Return if non-existent width or height
            if(width <= 0 || height <= 0) {
                return res();
            }
            // Calculate camera translation
            let w = maxX - minX;
            let h = maxY - minY;
            let x = minX + (w / 2);
            let y = minY + (h / 2);
            let r = Math.max(w / width, h / height);
            let k = Math.min(.9 / r, 2);
            let tX = focus.l + (width / 2) - (x * k);
            let tY = focus.t + (height / 2) - (y * k);
            // Move camera
            this._canvas!.transition()
                .duration(duration)
                .call(this._zoom.transform, 
                    d3.zoomIdentity.translate(tX, tY).scale(k)
                )
                .on("end", () => res())
        });
    }

    /**
     * Returns a promise that resolves once the current physics sim ends.
     * @returns
     *  A Promise that resolves once the current physics sim ends.
     */
    public waitForSimulationEnd(): Promise<void> {
        return this._movement.end;
    }

    /**
     * Switches the network to the given rendering mode.
     * @param mode
     *  The render mode to switch to.
     *  [RenderMode.None]
     *   Only render when instructed to (with render()).
     *  [RenderMode.Continuous]
     *   Render continuously. Dashed lines are animated.
     *  [RenderMode.Discrete]
     *   Only render when necessary. Dashed lines aren't animated.
     */
    private switchRenderMode(mode: RenderMode) {
        this._renderMode = mode;
        cancelAnimationFrame(this._rafId);
        this._simulation.on("tick", null);
        switch(mode) {
            default:
            case RenderMode.None:
                break;
            case RenderMode.Continuous:
                let render: () => void;
                let timeDiff: number = 0;
                let timeLast: number = 0;
                (render = () => {
                    this._rafId = requestAnimationFrame(timeNext => {
                        this._rafId = 0;
                        this.executeRenderPipeline();
                        timeDiff = timeLast ? timeNext - timeLast: 16, 
                        timeLast = timeNext;
                        this._context!.lineDashOffset =
                            (this._context!.lineDashOffset - 
                                (2 * timeDiff / 16)) % 30;
                        render();
                    });
                })();
                break;
            case RenderMode.Discrete:
                this._simulation
                    .on("tick", this.executeRenderPipeline.bind(this));
                this._rafId = 0;
                this.render();
                break;
        }
    }

    /**
     * Renders the graph.
     */
    public render() {
        if (this._rafId != 0)
            return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = 0;
            this.executeRenderPipeline()
        })
    }

    /**
     * Executes the graph rendering pipeline.
     * @throws { MissingFontStyleError }
     *  If any of the cluster labels reference a font style not defined in
     *  `textFormatFonts`.
     */
    private executeRenderPipeline() {

        // Return if there's no context to render to
        if(this._context === null)
            return;

        // Initialize render state
        let l = this._layers;
        let nIdx  = l.nMajor[0];
        let seIdx = l.seMajor[0];
        let weIdx = l.weMajor[0];
        let seMinorIdx = 0;
        let weMinorIdx = 0;

        // Clear viewport
        this._context.fillStyle = this._$.backgroundColor;
        this._context.fillRect(
            this._viewport[0],  this._viewport[2],
            this._viewport[1] - this._viewport[0],
            this._viewport[3] - this._viewport[2]
        );

        // Draw layer 1 (Unfocused Items)
        for(; weIdx < l.weMajor[1]; weMinorIdx++)
            weIdx = l.weMinor[weMinorIdx];
        for(; seIdx < l.seMajor[1]; seMinorIdx++)
            seIdx = this.drawStrongEdgeLayer(seIdx, l.seMinor[seMinorIdx]);
        nIdx = this.drawNodeLayer(nIdx, l.nMajor[1]);
        
        // Draw layer 2 (Focused Items)
        if(weIdx < l.weMajor[2]) {
            this._context.lineWidth = 2;
            this._context!.setLineDash([15, 15]);
            for(; weIdx < l.weMajor[2]; weMinorIdx++)
                weIdx = this.drawWeakEdgeLayer(weIdx, l.weMinor[weMinorIdx]);
            this._context!.setLineDash([]);
            this._context.lineWidth = 1;
        }
        for(; seIdx < l.seMajor[2]; seMinorIdx++)
            seIdx = this.drawStrongEdgeLayer(seIdx, l.seMinor[seMinorIdx]);
        nIdx = this.drawNodeLayer(nIdx, l.nMajor[2]);

        // Draw layer 3 (Selected Items)
        this._context.lineWidth = 4;

        if(weIdx < l.weMajor[3]) {
            this._context!.setLineDash([15, 15]);
            for(; weIdx < l.weMajor[3]; weMinorIdx++)
                weIdx = this.drawWeakEdgeLayer(weIdx, l.weMinor[weMinorIdx]);
            this._context!.setLineDash([]);
        }
        for(; seIdx < l.seMajor[3]; seMinorIdx++)
            seIdx = this.drawStrongEdgeLayer(seIdx, l.seMinor[seMinorIdx]);
        nIdx = this.drawNodeLayer(nIdx, l.nMajor[3]);

        // Draw feature boxes
        if(this._showClusterInfo) {
            let color = this._$.boundingCornerColor;
            this._context.fillStyle = color;
            this._context.strokeStyle = color;
            this._context.beginPath();
            for(let cluster of this._clusters) {   
                this._clusterRasterCache.draw(
                    this._context, cluster
                );
            }
            this._context.stroke();
        }

        // Reset context line width
        this._context.lineWidth = 1;

    }

    /**
     * Draws all nodes between the specified indices to the context.
     * @param beg
     *  The starting index. (Inclusive)
     * @param end
     *  The ending index. (Exclusive)
     * @returns
     *  The ending index.
     */
    private drawNodeLayer(beg: number, end: number): number {
        let node;
        for(;beg < end; beg++) {
            node = this._nodes[beg];
            if (this.isOutOfViewport(node))
                continue;
            this._nodeRasterCache.draw(this._context!, node);
        }
        return beg;
    }

    /**
     * Draws all strong edges between the specified indices to the context. 
     * @param beg
     *  The starting index. (Inclusive)
     * @param end
     *  The ending index. (Exclusive)
     * @returns
     *  The ending index.
     */
    private drawStrongEdgeLayer(beg: number, end: number): number {
        let style = this._strongEdges[beg].obj.style;
        let drawFunction = LinkStyleMap[style & LinkStyleMask];
        this._context!.fillStyle = LinkColorMap[style & FillColorMask];
        this._context!.strokeStyle = LinkColorMap[style & Stroke1ColorMask];
        this._context!.beginPath();
        let source, target;
        for(;beg < end; beg++) {
            source = this._strongEdges[beg].source;
            target = this._strongEdges[beg].target;
            if (this.isOutOfViewport(source) && this.isOutOfViewport(target))
                continue;
            drawFunction(this._context!, source, target);
        }
        this._context!.stroke();
        this._context!.fill();
        return beg;
    }

    /**
     * Draws all weak edges between the specified indices to the context. 
     * @param beg
     *  The starting index. (Inclusive)
     * @param end
     *  The ending index. (Exclusive)
     * @returns
     *  The ending index.
     */
    private drawWeakEdgeLayer(beg: number, end: number): number {
        let style = this._weakEdges[beg].obj.style;
        this._context!.fillStyle = LinkColorMap[style & FillColorMask];
        this._context!.strokeStyle = LinkColorMap[style & Stroke1ColorMask];
        this._context!.beginPath();
        let source, target;
        for (;beg < end; beg++) {
            source = this._weakEdges[beg].source;
            target = this._weakEdges[beg].target;
            this._context!.moveTo(source.x!, source.y!);
            this._context!.lineTo(target.x!, target.y!);
        }
        this._context!.stroke();
        return beg;
    }

    /**
     * Returns true if the given node lies outside of the viewport, false otherwise.
     * @param n
     *  The node to evaluate.
     * @returns
     *  True if the node lies outside of the viewport, false otherwise.
     */
    private isOutOfViewport(n: GraphNode): boolean {
        return n.x! < this._viewport[0] || this._viewport[1] < n.x! ||
            n.y! < this._viewport[2] || this._viewport[3] < n.y!
    }


    ///////////////////////////////////////////////////////////////////////////
    //  3. Canvas Interactions  ///////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Canvas click behavior. If there exists a node at the clicked location,
     * return it, otherwise return undefined.
     * @param event
     *  The click event.
     * @returns
     *  The clicked node or undefined if no node was clicked.
     */
    private onSelectSubject(event: any): GraphNode | undefined {
        let x = this._transform.invertX(event.x);
        let y = this._transform.invertY(event.y);
        let evt = event.sourceEvent;
        for (let i = this._nodes.length - 1; i >= 0; --i) {
            let node = this._nodes[i];
            let vertices = this._nodeRasterCache.getVertices(node);
            if (isInsideShape(x, y, node.x!, node.y!, vertices)) {
                this.emit("node-click", evt, node.obj, event.x, event.y);
                if(event.sourceEvent.button === MouseClick.Right) {
                    return undefined;
                } else {
                    return node;
                }
            }
        }
        this.emit("canvas-click", evt, event.x, event.y);
        return undefined;
    }

    /**
     * Node drag start behavior.
     * @param event
     *  The drag event.
     */
    private onNodeDragStarted(event: any) {
        this.declareMovement();
        if (!event.active)
            this._simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    /**
     * Node dragged behavior.
     * @param event
     *  The drag event.
     */
    private onNodeDragged(event: any) {
        event.subject.fx = event.subject.x + (event.dx / this._transform.k);
        event.subject.fy = event.subject.y + (event.dy / this._transform.k);
        event.subject.x = event.subject.fx;
        event.subject.y = event.subject.fy;
    }

    /**
     * Node drag end behavior.
     * @param event
     *  The drag event.
     */
    private onNodeDragEnded(event: any) {
        if (!event.active)
            this._simulation.alphaTarget(0);
        if (!(event.subject as GraphNode).isFrozen) {
            event.subject.fx = null;
            event.subject.fy = null;
        }
    }

    /**
     * Canvas zoom behavior.
     * @param event
     *  The zoom event.
     * @throws { MissingFontStyleError }
     *  If any of the cluster labels reference a font style not defined in
     *  `textFormatFonts`.
     */
    private onCanvasZoomed(event: any) {
        // Update cache
        if (this._transform.k !== event.transform.k) {
            clearTimeout(this._zoomTimeoutId);
            this._zoomTimeoutId = setTimeout(() => {
                let k = this._transform.k * this._ssaaScale;
                if(this._nodeRasterCache.getScale() !== k) {
                    this._nodeRasterCache.scale(k);
                    this._clusterRasterCache.scale(k);
                    this.render();
                }
            }, ForceDirectedNetwork.RASTER_CACHE_UPDATE_DELAY)
        }
        // Update transform
        this._transform = event.transform;
        // Update viewport
        this.recalculateViewportBounds();
        if(this._context) {
            transformContext(
                this._context, this._transform.k,
                this._transform.x, this._transform.y
            );
        }
        // If no source event, then we are already
        // running inside a requestAnimationFrame()
        if(event.sourceEvent === null) {
            // If no render scheduled, run render pipeline
            if(this._rafId === 0) this.executeRenderPipeline();
        } else {
            this.render();
        }
    }

    /**
     * Canvas resize behavior.
     * @param el
     *  The graph's container.
     * @throws { MissingFontStyleError }
     *  If any of the cluster labels reference a font style not defined in
     *  `textFormatFonts`.
     */
    private onCanvasResize(el: Element) {
        let newWidth = el.clientWidth;
        let newHeight = el.clientHeight;
        // Center viewport
        this._transform.x += (newWidth - this._elWidth) / 2;
        this._transform.y += (newHeight - this._elHeight) / 2;
        // Update dimensions
        this._elWidth = newWidth;
        this._elHeight = newHeight;
        // Update viewport
        this.recalculateViewportBounds();
        // Adjust viewport
        if(this._context) {
            resizeAndTransformContext(
                this._context, this._elWidth, this._elHeight,
                this._transform.k, this._transform.x, this._transform.y
            )
        }
        // Immediately redraw graph to context, if possible
        if(this._context)
            this.executeRenderPipeline();
    }

    /**
     * Device pixel ratio change behavior.
     * @remarks
     *  The device's pixel ratio can change when dragging the window to and
     *  from a monitor with high pixel density (like Apple Retina displays).
     */
    private onDevicePixelRatioChange() {
        // Update cache
        let k = this._transform.k * this._ssaaScale;
        this._nodeRasterCache.scale(k);
        this._clusterRasterCache.scale(k);
        if(!this._context) {
            return;
        }
        // Resize and transform context
        resizeAndTransformContext(
            this._context, this._elWidth, this._elHeight,
            this._transform.k, this._transform.x, this._transform.y
        )
        // Render
        this.render();
    }

    /**
     * Recalculates the viewport's bounds based on the container's current
     * dimensions.
     */
    private recalculateViewportBounds() {
        let t = this._transform;
        let padding = ForceDirectedNetwork.VIEWPORT_PADDING;
        this._viewport[0] = Math.round(t.invertX(-padding));
        this._viewport[1] = Math.round(t.invertX(this._elWidth + padding));
        this._viewport[2] = Math.round(t.invertY(-padding));
        this._viewport[3] = Math.round(t.invertY(this._elHeight + padding));
    }


    ///////////////////////////////////////////////////////////////////////////
    //  4. Network Simulation Data  ///////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Updates the nodes and edges that make up the force directed network.
     * @param nodes
     *  The set of nodes that make up the network.
     * @param edges
     *  The set of edges that make up the network.
     * @param complete
     *  If true, the physics sim will be run completely before returning.
     *  (Default: false)
     * @throws { MissingFontStyleError }
     *  If any of the cluster labels reference a font style not defined in
     *  `textFormatFonts`.
     */
    public setNodesAndEdges(
        nodes: GenericViewNode[], 
        edges: GenericViewEdge[], 
        complete: boolean = false
    ) {
        // Set nodes
        this._nodeIndex.clear();
        for (let node of nodes) {
            let n = {
                id: node.id,
                radius: SizeMap[node.style & SizeMask],
                obj: node
            };
            this._nodeIndex.set(node.id, n);
        }
        // Set edges
        this._edgeIndex.clear();
        for (let edge of edges) {
            if (this._edgeIndex.has(edge.id)) continue;
            let source = this._nodeIndex.get(edge.source.id);
            let target = this._nodeIndex.get(edge.target.id);
            if (source && target) {
                let e = { id: edge.id, source, target, obj: edge }
                this._edgeIndex.set(edge.id, e);
            }
        }
        // Run layout
        this.runLayout(complete)
    }

    /**
     * Computes the graph's layout, accounting for cluster features and
     * collapsed nodes, then restarts the physics simulation.
     * 
     * NOTE:
     * This function should be called anytime:
     *  - Items are collapsed / uncollapsed.
     *  - Cluster features are updated.
     *  - The cluster formatter is changed.
     * 
     * @param complete 
     *  If true, the physics sim will be run completely before returning.
     *  (Default: false)
     * @throws { MissingFontStyleError }
     *  If any of the cluster labels reference a font style not defined in
     *  `textFormatFonts`.
     * @throws { Error }
     *  If Activity Set contains unlinked edges.
     */
    public runLayout(complete: boolean = false) {
        
        // 1. Clone indices 
        let nodes = new Map<string, GraphNode>(this._nodeIndex);
        let edges = new Map<string, GraphEdge>(this._edgeIndex);

        // 2. Define helper functions
        let getNextEdges = (node: GraphNode): GraphEdge[] => 
            node.obj.next.filter(o => edges.has(o.id)).map(o => edges.get(o.id)!);
        let getPrevEdges = (node: GraphNode): GraphEdge[] => 
            node.obj.prev.filter(o => edges.has(o.id)).map(o => edges.get(o.id)!);
        let getNextNode = (edge: GraphEdge): GraphNode | undefined =>
            nodes.get(edge.target.id);
        let getPrevNode = (edge: GraphEdge): GraphNode | undefined =>
            nodes.get(edge.source.id);
        let removeNodeSequence = (node: GraphNode) => {
            let queue: GraphNode[] = [node];
            let visited = new Set([node.id]);
            while(queue.length) {
                let n = queue.shift()!;
                // Remove edges and collect adjacent nodes
                let adjacentNodes = [];
                for(let edge of getNextEdges(n)) {
                    edges.delete(edge.id);
                    let target = getNextNode(edge);
                    if(target) {
                        adjacentNodes.push(target);
                    }
                }
                // Remove and traverse adjacent nodes
                for(let node of adjacentNodes) {
                    let hasNoPrevEdges = getPrevEdges(node).length === 0;
                    if(!visited.has(node.id) && hasNoPrevEdges) {
                        visited.add(node.id);
                        queue.push(node);
                        nodes.delete(node.id);
                    }
                }
            }
        }

        // 2. Removed collapsed nodes from indices
        for(let node of nodes.values()) {
            if(node.obj.isCollapsed()) {
                removeNodeSequence(node);
            }
        }

        // 3. Removed collapsed edges from indices
        for(let edge of edges.values()) {
            if(edge.obj.isCollapsed()) {
                let node = getNextNode(edge)!;
                edges.delete(edge.id);
                nodes.delete(node.id); 
                removeNodeSequence(node);
            }
        }

        // 4. Derive nodes and edges
        this._nodes = [...nodes.values()];
        console.log(this._nodes)
        this._weakEdges = [];
        this._strongEdges = [];
        for(let edge of edges.values()) {
            if(edge.obj.isStrongEdge(this._clusterFeatures)) {
                this._strongEdges.push(edge);
            } else {
                this._weakEdges.push(edge);
                // Delete weak edges connecting clusters
                edges.delete(edge.id);
            }
        }
        
        // 5. Isolate node clusters
        type Cluster = { nodes: GraphNode[], features: ClusterFeatureSet };
        let clusters: Cluster[] = [];
        while(nodes.size !== 0) {
            let cluster: Cluster = { nodes: [], features: new Map() }
            let queue = [nodes.values().next().value];
            nodes.delete(queue[0].id);
            while(queue.length) {
                let n = queue.shift();
                cluster.nodes.push(n);
                // Traverse edges & nodes
                for(let edge of getPrevEdges(n)) {
                    edges.delete(edge.id);
                    let source = getPrevNode(edge);
                    if(source) {
                        nodes.delete(source.id);
                        queue.push(source);
                    }
                }
                for(let edge of getNextEdges(n)) {
                    edges.delete(edge.id);
                    let target = getNextNode(edge);
                    if(target) {
                        nodes.delete(target.id);
                        queue.push(target);
                    }
                }
            }
            clusters.push(cluster);
        }
        if(edges.size !== 0) {
            throw new Error("Activity Set contains unlinked edges.")
        }

        // 6. Parse cluster features
        for(let cluster of clusters) {
            let features = cluster.features;
            for(let node of cluster.nodes) {
                for(let feature in node.obj.features) {
                    let value = node.obj.features[feature];
                    if(value === undefined) {
                        value = "None";
                    }
                    if(!features.has(feature)) {
                        features.set(feature, new Set())
                    }
                    features.get(feature)!.add(value.toString());
                }
            }
        }

        // 7. Compile clusters
        this._clusters = clusters.map(
            c => new GraphCluster(this._formatClusterInfo(c.features), c.nodes)
        );

        // 8. Prerender nodes and clusters
        this._nodeRasterCache.prerender(this._nodes);
        this._clusterRasterCache.prerender(this._clusters);

        // 9. Refresh appearances
        this.refreshAppearances();

        // 10. Reload simulation data
        this.reloadSimulationData([...this._nodes], [...this._strongEdges], complete);

    }

    /*
     * Updates the appearance of all items in the graph.
     * 
     * NOTE:
     * This function should be called anytime:
     *  - Items are made visible / invisible.
     *  - Edges are selected / unselected.
     *  - Edges are focused / unfocused.
     *  - Edge visual attributes are changed.
     * 
     */
    public refreshAppearances() {
        this.relayer();
        // Switch render mode
        let hasWeakEdges = 0 < this._layers.weMajor[2] || 0 < this._layers.weMajor[3]
        if (!this._context) {
            return;
        } else if (hasWeakEdges && this._renderMode !== RenderMode.Continuous) {
            this.switchRenderMode(RenderMode.Continuous);
        } else if (!hasWeakEdges && this._renderMode !== RenderMode.Discrete) {
            this.switchRenderMode(RenderMode.Discrete);
        }
    }

    /**
     * Sorts all items by visual priority and appearance. Items with higher
     * priority are drawn over items with lower priority.
     */
    private relayer() {
        // Sort nodes by visual priority
        this._nodes.sort((a, b) => 
            gvp(a.obj.attrs) - 
            gvp(b.obj.attrs)
        );
        // Sort edges by visual priority and appearance 
        let mask = LinkStyleMask | FillColorMask | Stroke1ColorMask;
        let edgeSort = (a: GraphEdge, b: GraphEdge) => {
            let major = 
                gvp(a.obj.attrs) -
                gvp(b.obj.attrs);
            return major === 0 ? 
                (a.obj.style & mask) - 
                (b.obj.style & mask)
                : major
        };
        this._strongEdges.sort(edgeSort);
        this._weakEdges.sort(edgeSort);
        // Locate node layer boundaries
        this._layers.nMajor = findLayerSegments(this._nodes, 4, 0, gvp).layers;
        // Locate strong edge layer boundaries
        let se = findLayerSegments(this._strongEdges, 4, mask, gvp);
        this._layers.seMajor = se.layers;
        this._layers.seMinor = se.bounds; 
        // Locate weak edge layer boundaries
        let we = findLayerSegments(this._weakEdges, 4, mask, gvp);
        this._layers.weMajor = we.layers;
        this._layers.weMinor = we.bounds;
        // Note: 'gvp' = get visual priority
    }

    /**
     * Reloads the simulation data.
     * @param nodes
     *  The new set of nodes to use in the simulation.
     * @param edges
     *  The new set of edges to use in the simulation.
     * @param complete
     *  If true, the physics sim will be run completely before returning.
     *  (Default: false)
     * @param alpha
     *  The simulation's new alpha value.
     *  (Default: 1)
     */
    private async reloadSimulationData(
        nodes: GraphNode[], edges: GraphEdge[],
        complete: boolean = false, alpha: number = 1
    ) {
        // Clear current node positions
        for(let node of this._nodeIndex.values()) {
            node.x  = undefined;
            node.y  = undefined;
            node.vx = undefined;
            node.vy = undefined;
            node.fx = undefined;
            node.fy = undefined;
        }
        // Reload simulation
        this._simulation
            .nodes(nodes)
            .force<d3.ForceLink<GraphNode, GraphEdge>>("link")
            ?.links(edges)
        // Restart simulation
        this.declareMovement();
        this._simulation.alpha(alpha).restart();
        this._simulation.tick(10);
        // Run full simulation, if requested
        if(complete) {
            while(this._simulation.alpha() > this._simulation.alphaMin()) {
                this._simulation.tick();
            }
        }
        // Reapply freeze state after simulation end
        await this.waitForSimulationEnd();
        for (let node of nodes) {
            if(node.isFrozen) this.freezeNode(node.id);
        }
    }

    /**
     * Resets the _movement.end promise which resolves once all node movement
     * stops.
     * 
     * NOTE:
     * This function should be called anytime the simulation is restarted.
     * 
     */
    private declareMovement() {
        if(!this._movement.resolved)
            return;
        this._movement.resolved = false;
        this._movement.end = new Promise(r => this._movement.res = r).then(() => {
            this._movement.resolved = true;
        });
    }

}

export type NetworkStyle = {
    backgroundColor: string,
    boundingCornerColor: string,
    nodeLabelFont: FontDescriptor,
    textFormatFonts: { [key: string]: FontDescriptor }
}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// D3 types
type CanvasZoomBehavior = 
    d3.ZoomBehavior<HTMLCanvasElement, unknown>;
type CanvasSelection = 
    d3.Selection<HTMLCanvasElement, unknown, null, undefined>;

// Class types
type GraphLayers = {
    nMajor  : number[],
    weMajor : number[],
    weMinor : number[],
    seMajor : number[],
    seMinor : number[]
}
type ClusterFeatureSet = 
    Map<string, Set<Primitive>>
type CanvasFocusRegion = {
    t: number,
    l: number,
    b: number,
    r: number
}
enum RenderMode {
    None       = 0,
    Continuous = 1,
    Discrete   = 2
}

// Event types
interface GraphEvents {
    "node-click"   : (event: PointerEvent, node: GenericViewNode, x: number, y: number) => void;
    "canvas-click" : (event: PointerEvent, x: number, y: number) => void;
}
