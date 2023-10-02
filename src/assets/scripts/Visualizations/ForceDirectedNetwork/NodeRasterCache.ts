import { GraphNode } from "./GraphNode";
import { NodeRaster } from "./NodeRaster";
import { FontDescriptor, FontLoader } from "../Fonts";

export class NodeRasterCache {

    private _scale: number;
    private _font: FontDescriptor;
    private _rasterCache: Map<string, NodeRaster> 

    /**
     * Creates a new NodeRasterCache.
     */
    constructor() {
        this._scale = 1;
        this._font = { 
            family: "sans-serif", weight: 500, size: "9px",
            color: "#e6e6e6", lineHeight: 11
        };
        this._rasterCache = new Map();
    }

    /**
     * Sets the node label font.
     * 
     * NOTE:
     * This function will only affect newly generated node rasters. To affect
     * all rasters, consider using clear() to dump the existing rasters. 
     * 
     * @param font
     *  The font to use.
     * @returns
     *  A Promise that resolves once the provided font has been set.
     */
    public async setLabelFont(font: FontDescriptor): Promise<void> {
        try {
            await FontLoader.load(font);
            this._font = font;
        } catch(ex: any) {
            console.error(ex.message);
        }
    }

    /**
     * Pre-renders a set of nodes into the raster cache.
     * @param nodes
     *  The nodes to prerender.
     */
    public prerender(nodes: GraphNode[]) {
        for(let n of nodes) this.getOrCreateRaster(n);
    }

    /**
     * Empties the raster cache.
     */
    public clear() {
        this._rasterCache.clear();
    }

    /**
     * Draws a node onto a context.
     * @param context
     *  The context to draw on.
     * @param node
     *  The node to draw.
     */
    public draw(context: CanvasRenderingContext2D, node: GraphNode) {
        let raster = this.getOrCreateRaster(node);
        context.drawImage(
            raster.canvas,
            node.x! - raster.xCenterOffset, 
            node.y! - raster.yCenterOffset, 
            raster.width, raster.height
        );
    }

    /**
     * Scales the cache by the given value.
     * @param k
     *  The new scale value.
     */
    public scale(k: number) {
        this._scale = k;
        let scale = this._scale * window.devicePixelRatio;
        for(let raster of this._rasterCache.values()) {
            raster.scale(scale);
        }
    }

    /**
     * Returns the cache's current scale.
     * @returns
     *  The cache's current scale.
     */
    public getScale(): number {
        return this._scale;
    }

    /**
     * Returns the set of vertices, relative to (0,0), that make up a node.
     * @param node
     *  The node to lookup.
     * @returns
     *  The node's vertices.
     */
    public getVertices(node: GraphNode): number[] {
        return this.getOrCreateRaster(node).vertices;
    }

    /**
     * Returns a node's raster from the cache, if one doesn't exist, a new raster
     * is created and added to the cache.
     * @param node
     *  The node to lookup.
     * @returns
     *  The node's raster.
     */
    private getOrCreateRaster(node: GraphNode): NodeRaster {
        // Load raster
        let n = node.obj;
        let hash = `${ n.style }.${ n.getLabelHash() }`;
        let raster = this._rasterCache.get(hash);
        // If the raster doesn't exist yet, create it
        if(!raster) {
            raster = NodeRaster.create(n.style, n.getLabel(), this._font, this._scale);
            this._rasterCache.set(hash, raster);
        }
        return raster
    }

}
