import { TextRaster } from "./TextRaster";
import { GraphCluster } from "./GraphCluster";
import { FontDescriptor, FontLoader } from "../Fonts";

export class ClusterRasterCache {

    private _scale: number;
    private _fonts: Map<string, FontDescriptor>;
    private _rasterCache: Map<number, TextRaster> 

    /**
     * Creates a new ClusterRasterCache.
     */
    constructor() {
        this._scale = 1;
        this._fonts = new Map<string, FontDescriptor>();
        this._rasterCache = new Map();
    }

    /**
     * Adds a font style to the raster cache.
     * 
     * NOTE:
     * This function will only affect newly generated text rasters. To affect
     * all rasters, consider using clear() to dump the existing rasters. 
     * 
     * @param name
     *  The name of the font style.
     * @param font
     *  The font style.
     * @param
     *  A Promise that resolves once the provided font has been added.
     */
    public async registerFont(name: string, font: FontDescriptor): Promise<void> {
        try {
            await FontLoader.load(font);
            this._fonts.set(name, font);
        } catch(ex: any) {
            console.error(ex.message);
        }
    } 

    /**
     * Pre-renders a set of clusters into the raster cache.
     * @param clusters
     *  The clusters to prerender.
     * @throws { MissingFontStyleError }
     *  If any of the cluster labels reference a font style not registered with
     *  the cache.
     */
    public prerender(clusters: GraphCluster[]) {
        for(let c of clusters) this.getOrCreateTextRaster(c);
    }
    
    /**
     * Empties the raster cache.
     */
    public clear() {
        this._rasterCache.clear();
    }

    /**
     * Draws a cluster onto a context.
     * @param context
     *  The context to draw on.
     * @param cluster
     *  The cluster to draw.
     * @param padding
     *  The padding to add inside the box.
     *  (Default: 10)
     * @param length
     *  The length of the box's bound markers.
     *  (Default: 20)
     * @throws { MissingFontStyleError }
     *  If the cluster's label references a font style not registered with the
     *  cache.
     */
    public draw(
        context: CanvasRenderingContext2D, cluster: GraphCluster, 
        padding: number = 10, length: number = 20
    ) {
        let raster = this.getOrCreateTextRaster(cluster);
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity,
            radius = 0;
        for(let node of cluster.nodes){
            radius = node.radius;
            minX = Math.min(minX, node.x! - radius);
            minY = Math.min(minY, node.y! - radius);
            maxX = Math.max(maxX, node.x! + radius);
            maxY = Math.max(maxY, node.y! + radius);
        }
        minX -= padding, maxX += padding
        minY -= padding, maxY += padding
        context.drawImage(
            raster.canvas,
            minX - 9, minY - raster.height - 18, 
            raster.width, raster.height
        );
        context.moveTo(minX, minY + length);
        context.lineTo(minX, minY);
        context.lineTo(minX + length, minY);
        context.moveTo(maxX - length, minY);
        context.lineTo(maxX, minY);
        context.lineTo(maxX, minY + length);
        context.moveTo(maxX, maxY - length);
        context.lineTo(maxX, maxY);
        context.lineTo(maxX - length, maxY);
        context.moveTo(minX + length, maxY);
        context.lineTo(minX, maxY);
        context.lineTo(minX, maxY - length);
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
     * Returns a cluster's text raster from the cache, if one doesn't exist, a
     * new raster is created and added to the cache.
     * @param cluster
     *  The cluster to lookup.
     * @returns
     *  The cluster's text raster.
     * @throws { MissingFontStyleError }
     *  If the cluster's label references a font style not registered with the
     *  cache.
     */
    private getOrCreateTextRaster(cluster: GraphCluster): TextRaster {
        // Load raster
        let raster = this._rasterCache.get(cluster.labelHash);
        // If the raster doesn't exist yet, create it
        if(!raster) {
            raster = new TextRaster(cluster.label, this._fonts, 4, this._scale);
            this._rasterCache.set(cluster.labelHash, raster);
        }
        return raster
    }

}
