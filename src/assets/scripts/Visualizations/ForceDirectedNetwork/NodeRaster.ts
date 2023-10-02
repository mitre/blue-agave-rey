import { hexToHsv, hsvToHex } from "../Color";
import { FontDescriptor, FontLoader } from "@/assets/scripts/Visualizations/Fonts"
import { ColorMap, OpacityMap, SizeMap, StrokeSizeMap } from "../VisualAttributeValues";
import {
    ShapeMask, SizeMask,
    FillColor, FillColorMask,  
    Stroke1Color, Stroke1ColorMask,
    Stroke1WidthMask, Stroke2ColorMask,
    DimmedMask, Shape, Stroke2Color,
    Stroke2WidthMask
} from "../VisualAttributes";

const DEGREES_360 = 2 * Math.PI;
const TAN_30      = 0.57735;
const CSC_30      = 2;
const CSC_60      = 1.15470;
const SQRT_3      = 1.73205;
const RHOM_RATIO  = 0.64;
const CSC_32_62   = 1.85506;
const CSC_57_38   = 1.18728;


///////////////////////////////////////////////////////////////////////////////
//  1. NodeRaster  ////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export abstract class NodeRaster {

    public canvas: HTMLCanvasElement
    public xCenterOffset: number
    public yCenterOffset: number
    public width: number
    public height: number
    public vertices: number[]

    protected _context: CanvasRenderingContext2D;
    protected _attrs: number
    protected _label: string
    protected _stroke: number
    protected _font: string
    protected _fontColor: string;
    protected _fontColorBorder: string;
    protected _padding: number;
    protected _padTotalWidth: number

    /**
     * Creates a new NodeRaster.
     * @param attrs
     *  The node's visual attributes.
     * @param label
     *  The node's label.
     * @param font
     *  The node's font.
     * @param padding
     *  The node's padding.
     */
    protected constructor(attrs: number, label: string, font: FontDescriptor, padding: number) {
        this.canvas = document.createElement("canvas");
        this.xCenterOffset = 0;
        this.yCenterOffset = 0;
        this.width = 0;
        this.height = 0;
        this.vertices = []
        this._context = this.canvas.getContext("2d")!;
        this._attrs = attrs;
        this._label = label;
        this._stroke = Math.max(
            StrokeSizeMap[this._attrs & Stroke1WidthMask],
            StrokeSizeMap[this._attrs & Stroke2WidthMask]
        );
        this._font = FontLoader.getCssFontString(font);
        this._fontColor = font.color ?? "#ffffff";
        let [h,s,v] = hexToHsv(ColorMap[this._attrs & FillColorMask]);
        this._fontColorBorder = hsvToHex(h, s, v - 10);
        this._padding = padding;
        this._padTotalWidth = padding << 1;
        this._context.font = this._font;
    }
    
    /**
     * Creates a new NodeRaster.
     * @param attrs
     *  The node's visual attributes.
     * @param label
     *  The node's label.
     * @param font
     *  The node's font.
     * @param k
     *  The raster's scale.
     *  (Default: 1)
     * @param padding
     *  The node's padding.
     *  (Default: 4)
     * @returns
     *  The newly created NodeRaster.
     */
    public static create(
        attrs: number, label: string, font: FontDescriptor, 
        k: number = 1, padding: number = 4
    ): NodeRaster {
        switch (attrs & ShapeMask) {
            default:
            case Shape.Circle:
                return new CircleNodeRaster(attrs, label, font, padding, k);
            case Shape.Triangle:
                return new TriangleNodeRaster(attrs, label, font, padding, k);
            case Shape.Square:
                return new SquareNodeRaster(attrs, label, font, padding, k);
            case Shape.Rhombus:
                return new RhombusNodeRaster(attrs, label, font, padding, k);
            case Shape.Hexagon:
                return new HexagonNodeRaster(attrs, label, font, padding, k);    
        }
    }

    /**
     * Redraws the raster at the given scale.
     * @param k
     *  The new scale of the raster.
     */
    public abstract scale(k: number): void;

    /**
     * Calculates the label's placements over a shape of the given size.
     * @param sWidth
     *  The width of the shape. (Must be a whole number for best results.)
     * @param sHeight
     *  The height of the shape. (Must be a whole number for best results.)
     * @param lineHeight
     *  The font's line height.
     * @returns
     *  The calculated layout.
     */
    protected calculateRasterLayout(sWidth: number, sHeight: number, lineHeight: number): RasterLayout {
        // Calculate canvas size
        let lines    = this._label.split(/\n/);
        let tWidth   = 0;
        let tHeight  = 0;
        let lXOffset = new Array(lines.length);
        let sizing, h;
        for(let i = 0; i < lines.length; i++) {
            sizing = this._context.measureText(lines[i]);
            h = sizing.actualBoundingBoxAscent + sizing.actualBoundingBoxDescent;
            lXOffset[i] = Math.ceil(sizing.width);
            tWidth  = Math.max(tWidth, lXOffset[i]);
            tHeight = Math.max(tHeight, (i * lineHeight) + Math.ceil(h))
        }
        let lYOffset = sizing?.actualBoundingBoxAscent ?? 0;
        let cWidth  = Math.max(tWidth, sWidth);
        let cHeight = Math.max(tHeight, sHeight);
        // Ensure the canvas and shape size maintain equal parity 
        cWidth  += Math.abs((sWidth % 2) - (cWidth % 2))
        cHeight += Math.abs((sHeight % 2) - (cHeight % 2))
        // Calculate each line's x offset
        for(let i = 0; i < lXOffset.length; i++) {
            lXOffset[i] = Math.round((cWidth / 2) - (lXOffset[i] / 2))
        }
        // Calculate shape and text placements
        let sXOffset = (cWidth >> 1) - (sWidth >> 1);
        let sYOffset = (cHeight >> 1) - (sHeight >> 1);
        let tYOffset = (cHeight >> 1) - (tHeight >> 1);
        // Return calculated placements
        return { 
            lines,
            cWidth, cHeight, 
            sXOffset, sYOffset,
            lXOffset, lYOffset,
            tYOffset,
            lineHeight
        }
        // Note: 'l' = label, 't' = text, 'c' = canvas, 's' = shape
    }

    /**
     * Renders the context and updates the size and offset state.
     * 
     * NOTE:
     * The context must already be configured with a path to draw.
     * 
     * @param r
     *  The node's raster layout.
     * @param k
     *  The node's scale.
     */
    protected renderNode(r: RasterLayout, k: number) {
        let padding = this._padding / k;
        // Draw node
        if((this._attrs & FillColorMask) != FillColor.None)
            this._context.fill();
        if((this._attrs & Stroke1ColorMask) != Stroke1Color.None)
            this._context.stroke();
        if((this._attrs & Stroke2ColorMask) != Stroke2Color.None) {
            this._context.strokeStyle = ColorMap[(this._attrs & Stroke2ColorMask) >>> 4];
            this._context.lineWidth = StrokeSizeMap[this._attrs & Stroke2WidthMask] << 1;
            this._context.stroke();
        }
        // Draw label stroke (removed for now)
        // this._context.strokeStyle = this._fontColorBorder;
        // this._context.lineWidth = 1.5
        // for(let i = 0; i < r.lines.length; i++) {
        //     this._context.strokeText(
        //         r.lines[i], 
        //         padding + r.lXOffset[i], 
        //         padding + r.tYOffset + (i * r.lineHeight) + r.lYOffset
        //     );
        // }
        // Draw label
        this._context.fillStyle = this._fontColor;
        for(let i = 0; i < r.lines.length; i++) {
            this._context.fillText(
                r.lines[i], 
                padding + r.lXOffset[i], 
                padding + r.tYOffset + (i * r.lineHeight) + r.lYOffset
            );
        }
        // Update size and offset
        this.width = r.cWidth + (this._padTotalWidth / k);
        this.height = r.cHeight + (this._padTotalWidth / k);
        this.xCenterOffset = Math.round(this.width / 2);
        this.yCenterOffset = Math.round(this.height / 2);
    }

    /**
     * Resets the internal canvas and prepares its context.  
     * @param attrs
     *  The node's visual attributes.
     * @param r
     *  The node's raster layout.
     * @param k
     *  The new scale of the context.
     */
    protected prepareCanvas(attrs: number, r: RasterLayout, k: number) {
        // Resize canvas
        this.canvas.width = (r.cWidth * k) + this._padTotalWidth;
        this.canvas.height = (r.cHeight * k) + this._padTotalWidth;
        // Style context
        this._context.lineWidth   = StrokeSizeMap[attrs & Stroke1WidthMask] << 1;
        this._context.fillStyle   = ColorMap[attrs & FillColorMask];
        this._context.strokeStyle = ColorMap[attrs & Stroke1ColorMask];
        this._context.globalAlpha = OpacityMap[attrs & DimmedMask];
        this._context.font = this._font;
        // Scale context
        this._context.setTransform(k, 0, 0, k, 0, 0);
    }

}


///////////////////////////////////////////////////////////////////////////////
//  2. CircleNodeRaster  //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class CircleNodeRaster extends NodeRaster {

    private _oRadius: number;
    private _iRadius: number;
    private _layout: RasterLayout;

    /**
     * Creates a new CircleNodeRaster.
     * @param attrs
     *  The node's visual attributes.
     * @param label
     *  The node's label.
     * @param font
     *  The node's font.
     * @param padding
     *  The node's padding.
     * @param k
     *  The node's scale.
     */
    constructor(attrs: number, label: string, font: FontDescriptor, padding: number, k: number) {
        super(attrs, label, font, padding);
        // Calculate shape
        this._iRadius = SizeMap[this._attrs & SizeMask];
        this._oRadius = this._iRadius + this._stroke;
        let sw = this._oRadius << 1;
        // Calculate layout
        this._layout = this.calculateRasterLayout(sw, sw, font.lineHeight ?? 0);
        // Calculate vertices
        this.vertices = [this._oRadius]
        // Render image
        this.scale(k);
    }

    /**
     * Redraws the raster at the given scale.
     * @param k
     *  The new scale of the raster.
     */
    public scale(k: number) {
        let r = this._layout;        
        // Prepare canvas
        this.prepareCanvas(this._attrs, r, k);
        let scaledPadding = this._padding / k;
        // Draw shape
        this._context.beginPath();
        let center = scaledPadding + this._oRadius;
        this._context.closePath();
        this._context.arc(
            r.sXOffset + center, 
            r.sYOffset + center,
            this._iRadius, 
            0, DEGREES_360
        );
        // Render node
        this.renderNode(r, k);
    }

}


///////////////////////////////////////////////////////////////////////////////
//  3. TriangleNodeRaster  ////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class TriangleNodeRaster extends NodeRaster {

    private _iWidth: number;
    private _iHeight: number;
    private _strokeAdj: number;
    private _strokeHyp: number;
    private _layout: RasterLayout;

    /**
     * Creates a new TriangleNodeRaster.
     * @param attrs
     *  The node's visual attributes.
     * @param label
     *  The node's label.
     * @param font
     *  The node's font.
     * @param padding
     *  The node's padding.
     * @param k
     *  The node's scale.
     */
    constructor(attrs: number, label: string, font: FontDescriptor, padding: number, k: number) {
        super(attrs, label, font, padding);
        // Calculate shape
        this._iWidth = SizeMap[this._attrs & SizeMask] << 1;
        this._iHeight = (SQRT_3 * this._iWidth) / 2
        this._strokeAdj = this._stroke / TAN_30;
        this._strokeHyp = this._stroke * CSC_30;
        let oWidth = Math.ceil(this._iWidth + (2 * this._strokeAdj));
        let oHeight = Math.ceil((SQRT_3 * oWidth) / 2);
        // Calculate layout
        this._layout = this.calculateRasterLayout(oWidth, oHeight, font.lineHeight ?? 0);
        // If text is smaller than shape, nudge it down a bit
        if(this._layout.sYOffset === 0)
            this._layout.lYOffset += 3;
        // Calculate vertices
        let hw = oWidth / 2;
        let hh = oHeight / 2;
        this.vertices = [
            0,   -hh,
            -hw, +hh,
            +hw, +hh
        ];
        // Render image
        this.scale(k);
    }

    /**
     * Redraws the raster at the given scale.
     * @param k
     *  The new scale of the raster.
     */
    public scale(k: number) {
        let r = this._layout;        
        // Prepare canvas
        this.prepareCanvas(this._attrs, r, k);
        let scaledPadding = this._padding / k;
        // Draw shape
        this._context.beginPath();
        let d1 = r.sXOffset + scaledPadding + this._strokeAdj;
        let d2 = r.sYOffset + scaledPadding + this._strokeHyp;
        this._context.moveTo(d1, d2 + this._iHeight);
        this._context.lineTo(d1 + (this._iWidth / 2), d2);
        this._context.lineTo(d1 + this._iWidth, d2 + this._iHeight);
        this._context.closePath();
        // Render node
        this.renderNode(r, k);
    }

}


///////////////////////////////////////////////////////////////////////////////
//  4. SquareNodeRaster  //////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class SquareNodeRaster extends NodeRaster {

    private _iWidth: number;
    private _layout: RasterLayout;

    /**
     * Creates a new SquareNodeRaster.
     * @param attrs
     *  The node's visual attributes.
     * @param label
     *  The node's label.
     * @param font
     *  The node's font.
     * @param padding
     *  The node's padding.
     * @param k
     *  The node's scale.
     */
    constructor(attrs: number, label: string, font: FontDescriptor, padding: number, k: number) {
        super(attrs, label, font, padding);
        // Calculate shape
        this._iWidth = SizeMap[this._attrs & SizeMask] << 1;
        let oWidth = (this._iWidth + (2 * this._stroke));
        // Calculate layout
        this._layout = this.calculateRasterLayout(oWidth, oWidth, font.lineHeight ?? 0);
        // Calculate vertices
        let hw = oWidth / 2;
        this.vertices = [
            -hw, +hw,
            +hw, +hw,
            +hw, -hw,
            -hw, -hw
        ];
        // Render image
        this.scale(k);
    }

    /**
     * Redraws the raster at the given scale.
     * @param k
     *  The new scale of the raster.
     */
    public scale(k: number) {
        let r = this._layout;        
        // Prepare canvas
        this.prepareCanvas(this._attrs, r, k);
        let scaledPadding = this._padding / k;
        // Draw shape
        this._context.beginPath();
        let x = r.sXOffset + scaledPadding + this._stroke;
        let y = r.sYOffset + scaledPadding + this._stroke;
        this._context.rect(x, y, this._iWidth, this._iWidth);
        this._context.closePath();
        // Render node
        this.renderNode(r, k);
    }

}


///////////////////////////////////////////////////////////////////////////////
//  5. RhombusNodeRaster  /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class RhombusNodeRaster extends NodeRaster {

    private _iWidth: number;
    private _iHeight: number;
    private _strokeHyp1: number;
    private _strokeHyp2: number;
    private _layout: RasterLayout;

    /**
     * Creates a new RhombusNodeRaster.
     * @param attrs
     *  The node's visual attributes.
     * @param label
     *  The node's label.
     * @param font
     *  The node's font.
     * @param padding
     *  The node's padding.
     * @param k
     *  The node's scale.
     */
    constructor(attrs: number, label: string, font: FontDescriptor, padding: number, k: number) {
        super(attrs, label, font, padding);
        // Calculate shape
        this._iWidth = SizeMap[this._attrs & SizeMask] << 1;
        this._iHeight = this._iWidth * RHOM_RATIO;
        this._strokeHyp1 = this._stroke * CSC_32_62;
        this._strokeHyp2 = this._stroke * CSC_57_38;
        let oWidth = Math.ceil(this._iWidth + (2 * this._strokeHyp1));
        let oHeight = Math.ceil(this._iHeight + (2 * this._strokeHyp2));
        // Calculate layout
        this._layout = this.calculateRasterLayout(oWidth, oHeight, font.lineHeight ?? 0);
        // Calculate vertices
        let hw = oWidth / 2;
        let hh = oHeight / 2;
        this.vertices = [
            -hw, 0,
            0, -hh,
            +hw, 0,
            0, +hh
        ];
        // Render image
        this.scale(k);
    }

    /**
     * Redraws the raster at the given scale.
     * @param k
     *  The new scale of the raster.
     */
    public scale(k: number) {
        let r = this._layout;        
        // Prepare canvas
        this.prepareCanvas(this._attrs, r, k);
        let scaledPadding = this._padding / k;
        // Draw shape
        this._context.beginPath();
        let d1 = r.sXOffset + scaledPadding + this._strokeHyp1;
        let d2 = r.sYOffset + scaledPadding + this._strokeHyp2;
        let hh = this._iHeight / 2;
        let hw = this._iWidth / 2;
        this._context.moveTo(d1, d2 + hh);
        this._context.lineTo(d1 + hw, d2);
        this._context.lineTo(d1 + this._iWidth, d2 + hh);
        this._context.lineTo(d1 + hw, d2 + this._iHeight);
        this._context.closePath();
        // Render node
        this.renderNode(r, k);
    }

}


///////////////////////////////////////////////////////////////////////////////
//  6. HexagonNodeRaster  /////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export class HexagonNodeRaster extends NodeRaster {

    private _iWidth: number;
    private _iHeight: number;
    private _strokeHyp1: number;
    private _layout: RasterLayout;

    /**
     * Creates a new HexagonNodeRaster.
     * @param attrs
     *  The node's visual attributes.
     * @param label
     *  The node's label.
     * @param font
     *  The node's font.
     * @param padding
     *  The node's padding.
     * @param k
     *  The node's scale.
     */
    constructor(attrs: number, label: string, font: FontDescriptor, padding: number, k: number) {
        super(attrs, label, font, padding);
        // Calculate shape
        this._iWidth  = SizeMap[this._attrs & SizeMask] << 1;
        this._iHeight = SQRT_3 * (this._iWidth / 2);
        this._strokeHyp1 = this._stroke * CSC_60;
        let oWidth  = Math.ceil(this._iWidth + (2 * this._strokeHyp1));
        let oHeight = Math.ceil(this._iHeight + (2 * this._stroke));
        // Calculate layout
        this._layout = this.calculateRasterLayout(oWidth, oHeight, font.lineHeight ?? 0);
        // Calculate vertices
        let hw = oWidth / 2;
        let hh = oHeight / 2;
        let hhw = hw / 2;
        this.vertices = [
            -hw, 0,
            -hhw, -hh,
            +hhw, -hh,
            +hw, 0,
            +hhw, +hh,
            -hhw, +hh
        ];
        // Render image
        this.scale(k);
    }

    /**
     * Redraws the raster at the given scale.
     * @param k
     *  The new scale of the raster.
     */
    public scale(k: number) {
        let r = this._layout;        
        // Prepare canvas
        this.prepareCanvas(this._attrs, r, k);
        let scaledPadding = this._padding / k;
        // Draw shape
        this._context.beginPath();
        let d1 = r.sXOffset + scaledPadding + this._strokeHyp1;
        let d2 = r.sYOffset + scaledPadding + this._stroke;
        let d3 = this._iWidth / 4;
        let hh = this._iHeight / 2;
        this._context.moveTo(d1, d2 + hh);
        this._context.lineTo(d1 + d3, d2);
        this._context.lineTo(d1 + (3 * d3), d2);
        this._context.lineTo(d1 + this._iWidth, d2 + hh);
        this._context.lineTo(d1 + (3 * d3), d2 + this._iHeight);
        this._context.lineTo(d1 + d3, d2 + this._iHeight);
        this._context.closePath();
        // Render node
        this.renderNode(r, k);
    }

}


///////////////////////////////////////////////////////////////////////////////
//  7. Internal Types  ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


export type RasterLayout = {
    lines: string[],
    cWidth: number,
    cHeight: number,
    sXOffset: number, 
    sYOffset: number,
    lXOffset: number[], 
    lYOffset: number,
    tYOffset: number,
    lineHeight: number
}
