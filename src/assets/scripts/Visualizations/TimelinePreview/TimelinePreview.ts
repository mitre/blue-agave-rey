import { clamp } from "../../Math";
import { Device } from "../../WebUtilities/Device";
import { ColorMap } from "../VisualAttributeValues";
import { FillColorMask } from "../VisualAttributes";
import { createHatchPattern } from "../Patterns";
import { GenericTimelineLane } from "../ViewBaseTypes/GenericTimelineLane";
import { type ITimeframe, Timeframe } from "../../Collections/Timeframe";
import { type FontDescriptor, FontLoader } from "../Fonts";
import { resizeContext, styleContext } from "../Canvas";
import {
    Time,
    formatDate,
    format12HourTime,
    format24HourTime,
    calculatePixelAtMs,
    calculatePixelAtTime,
    calculateTimeAtPixel,
    timeDurationFromWidth,
    fitTimeframeInInterval,
    type FittedIntervalParameters
} from "@/assets/scripts/Visualizations/Time";

export class TimelinePreview {

    // Timeline Preview Fields
    private _$: TimelinePreviewComputedStyle;
    private _fit: FittedIntervalParameters;
    private _rafId: number;
    private _context: CanvasRenderingContext2D | null;
    private _tfBegPx: number;
    private _tfEndPx: number;
    private _elWidth: number;
    private _elHeight: number;
    private _tickHeight: number;
    private _tickOffsetX: number;
    private _detailLevel: number;
    private _hatchPattern: CanvasPattern;
    private _onResizeObserver: ResizeObserver | null;

    // Data Fields
    private _lanes: GenericTimelineLane[];
    private _timeframe: Timeframe
    private _formatTime: (date: Date, level: number) => string;

    /**
     * Creates a new TimelinePreview.
     */
    constructor() {

        // Setup timeline preview state
        this._rafId = 0;
        this._context = null;
        this._tfBegPx = 0;
        this._tfEndPx = 0;
        this._elWidth = 0;
        this._elHeight = 0;
        this._tickHeight = 0;
        this._tickOffsetX = 0;
        this._detailLevel = 0;
        this._onResizeObserver = null;

        // Setup data state
        this._lanes = [];
        this._timeframe = Timeframe.TODAY.copy();
        this._formatTime = format12HourTime;

        // Set default style
        this._$ = {
            backgroundColor: "#2b2b2b",
            hatchColor: "#414141",
            header: {
                height: 32,
                fillColor: "#212121",
                strokeColor: "#0f0f0f",
            },
            ticker: {
                dateFont: {
                    lineHeight: 13,
                    family: "monospace",
                    color: "#808080",
                    size: "8.25pt",
                },
                timeFont: {
                    lineHeight: 13,
                    family: "monospace",
                    color: "#bfbfbf",
                    size: "8.25pt"
                },
                dateFontCss: "",
                timeFontCss: "",
                textSidePadding: 5,
                lineColor: "#383838",
                minimumIntervalWidth: 100
            },
            preview: {
                verticalPadding: 2,
                tickWidth: 2,
            },
        };
        this._$.ticker.dateFontCss = 
            FontLoader.getCssFontString(this._$.ticker.dateFont);
        this._$.ticker.timeFontCss = 
            FontLoader.getCssFontString(this._$.ticker.timeFont);
        this._hatchPattern =
            createHatchPattern(0.5, 1, this._$.backgroundColor, this._$.hatchColor);
        this._fit =
            fitTimeframeInInterval(this._timeframe, 0, this._$.ticker.minimumIntervalWidth);
        
    }


    ///////////////////////////////////////////////////////////////////////////
    //  1. Inject, Destroy, Queries and, Configuration  ///////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Injects the timeline preview into a container.
     * @param container
     *  The container to inject the timeline preview into.
     * @returns
     *  The TimelinePreview.
     */
    public inject(container: HTMLElement): TimelinePreview {

        // Set sizing
        this._elWidth = container.clientWidth;
        this._elHeight = container.clientHeight;

        // Setup canvas & context
        let canvas = document.createElement("canvas");
        canvas.style.display = "block";
        this._context = canvas.getContext("2d", { alpha: false })!;

        // Size context
        resizeContext(this._context, this._elWidth, this._elHeight);

        // Apply base styling
        styleContext(this._context, {
            textAlign: "right",
            lineWidth: 1
        });

        // Configure resize observer
        this._onResizeObserver = new ResizeObserver(
            entries => this.onCanvasResize(entries[0].target)
        );
        this._onResizeObserver.observe(container);

        // Configure dppx change behavior
        Device.on("dppx-change", this.onDevicePixelRatioChange, this);

        // Run layout
        this.runLayout();

        // Update preview sizing
        this.updatePreviewSizing();

        // Inject canvas
        container.appendChild(canvas);

        // Return Preview
        return this;
    }

    /**
     * Removes the timeline preview from the container.
     * @returns
     *  The TimelinePreview.
     */
    public destroy(): TimelinePreview {
        this._context?.canvas.remove();
        this._context = null;
        this._onResizeObserver?.disconnect();
        Device.removeEventListenersWithContext(this);
        return this;
    }

    /**
     * Sets the timeline preview's styling.
     * @param style
     *  The timeline preview's style parameters.
     * @returns
     *  A Promise that resolves with the TimelinePreview once the styling has
     *  been applied.
     */
    public async setPreviewStyle(style: TimelinePreviewStyle): Promise<TimelinePreview> {
        // Update style
        this._$ = {
            ...style,
            ticker: {
                ...style.ticker,
                dateFont: {
                    color: "#000",
                    lineHeight: 13,
                    ...style.ticker.dateFont,
                },
                timeFont: {
                    color: "#000",
                    lineHeight: 13,
                    ...style.ticker.timeFont,
                },
                timeFontCss:
                    FontLoader.getCssFontString(style.ticker.timeFont),
                dateFontCss:
                    FontLoader.getCssFontString(style.ticker.dateFont)
            }
        };
        // Load required fonts
        try {
            await FontLoader.load(this._$.ticker.dateFont);
            await FontLoader.load(this._$.ticker.timeFont);
        } catch(ex: any) {
            console.error(ex.message);
        }
        // Update hatch pattern
        this._hatchPattern = 
            createHatchPattern(0.5, 1, this._$.backgroundColor, this._$.hatchColor);
        // Run preview layout
        this.runLayout();
        // Update preview sizing
        this.updatePreviewSizing();
        // Return Preview
        return this;
    }
    
    /**
     * Set time display to 12 or 24 hour time.
     * @param value
     *  [true]
     *   Use 24-hour time.
     *  [false]
     *   Use 12-hour time.
     * @returns
     *  The TimelinePreview.
     */
    public setDisplay24HourTime(value: boolean): TimelinePreview {
        this._formatTime = value ? format24HourTime : format12HourTime;
        return this;
    }

    /**
     * Gets the given timeframe's location and width (in pixels).
     * (Relative to the preview window.)
     * @param timeframe
     *  The timeframe to evaluate.
     * @returns
     *  The location and width of the timeframe (in pixels).
     */
    public getTimeframeLocationAndWidth(timeframe: ITimeframe): { x: number, width: number } {
        let x1 = calculatePixelAtTime(this._fit, this._elWidth, timeframe.beg),
            x2 = calculatePixelAtTime(this._fit, this._elWidth, timeframe.end)
        return { x: x1, width: x2 - x1 }
    }

    /**
     * Gets the amount time (in milliseconds) a region of pixels represents.
     * (Relative to the preview window.)
     * @param width
     *  The width of the region (in pixels).
     * @returns
     *  The amount of time (in milliseconds) the region represents.
     */
    public getTimeLength(width: number): number {
        return timeDurationFromWidth(this._fit, this._elWidth, width);
    }

    /**
     * Gets the time at the given (pixel) location.
     * (Relative to the preview window.)
     * @param x
     *  The location to evaluate.
     * @returns
     *  The time at the given location.
     */
    public getTimeAtLocation(x: number): Date {
        return calculateTimeAtPixel(this._fit, this._elWidth, x)
    }


    ///////////////////////////////////////////////////////////////////////////
    //  2. Rendering  /////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Renders the timeline preview.
     */
    public render() {
        if (this._rafId != 0)
            return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = 0;
            this.executeRenderPipeline();
        })
    }

    /**
     * Executes the timeline preview rendering pipeline.
     */
    private executeRenderPipeline() {

        // Return if there's no context to render to
        if (this._context === null)
            return;

        // Initialize render state
        let { header, ticker, preview } = this._$;
        let fit = this._fit;

        // Clear viewport
        this._context.fillStyle = this._$.backgroundColor;
        this._context.fillRect(0, 0, this._elWidth, this._elHeight);

        // Draw ticker header
        this._context.fillStyle = header.fillColor;
        this._context.strokeStyle = header.strokeColor;
        this._context.fillRect(0, 0, this._elWidth, header.height);
        this._context.beginPath();
        this._context.moveTo(0, header.height - 0.5);
        this._context.lineTo(this._elWidth, header.height - 0.5);
        this._context.stroke();

        // Shade out-of-timeframe regions    
        let height = this._elHeight - header.height;
        let width2 = this._elWidth - this._tfEndPx;
        this._context.fillStyle = this._hatchPattern;
        this._context.fillRect(0, header.height, this._tfBegPx, height);
        this._context.fillRect(this._tfEndPx, header.height, width2, height);

        // Draw ticker lines
        let xr;
        let time = new Date(0);        
        let i = fit.beg.getTime() + fit.intervalDur;
        this._context.font = ticker.dateFontCss;
        this._context.fillStyle = ticker.dateFont.color!;
        this._context.strokeStyle = ticker.lineColor;
        this._context.beginPath();
        for (;i <= fit.end.getTime(); i += fit.intervalDur) {
            // Set time
            time.setTime(i);
            // Lines
            xr = Math.round(calculatePixelAtMs(fit, this._elWidth, i));
            this._context.moveTo(xr + 0.5, 0);
            this._context.lineTo(xr + 0.5, this._elHeight);
            // Date
            this._context.fillText(
                formatDate(time),
                xr - ticker.textSidePadding,
                ticker.dateFont.lineHeight!
            );
        }
        this._context.stroke();
        // Time
        i = fit.beg.getTime() + fit.intervalDur;
        this._context.font = ticker.timeFontCss;
        this._context.fillStyle = ticker.timeFont.color!;
        for (;i <= fit.end.getTime(); i += fit.intervalDur) {
            // Set time
            time.setTime(i);
            // Draw
            xr = Math.round(calculatePixelAtMs(fit, this._elWidth, i));
            this._context.fillText(
                this._formatTime(time, this._detailLevel),
                xr - ticker.textSidePadding,
                ticker.dateFont.lineHeight! + ticker.timeFont.lineHeight!
            );
        }

        // Render lanes
        let tickY = header.height + preview.verticalPadding, tickX;
        for (let lane of this._lanes) {
            if (!lane.isVisible()) continue;
            for (let track of lane.tracks) {
                for (let node of track.nodes) {
                    tickX = Math.round(calculatePixelAtTime(fit, this._elWidth, node.time));
                    this._context.fillStyle = ColorMap[node.style & FillColorMask];
                    this._context.fillRect(
                        tickX - this._tickOffsetX, tickY, 
                        preview.tickWidth, this._tickHeight
                    );
                }
            }
            tickY += this._tickHeight;
        }

    }


    ///////////////////////////////////////////////////////////////////////////
    //  3. Canvas Interactions  ///////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Canvas resize behavior.
     * @param el
     *  The preview's container.
     */
    private onCanvasResize(el: Element) {
        this._elWidth = el.clientWidth;
        this._elHeight = el.clientHeight;
        // Update canvas dimensions
        this.resizeContexts(this._elWidth, this._elHeight);
        // Run preview layout
        this.runLayout();
        // Update preview sizing
        this.updatePreviewSizing();
        // Immediately redraw preview to context, if possible
        if (this._context)
            this.executeRenderPipeline();
    }

    /**
     * Device pixel ratio change behavior.
     * @remarks
     *  The device's pixel ratio can change when dragging the window to and
     *  from a monitor with high pixel density (like Apple Retina displays).
     */
    private onDevicePixelRatioChange() {
        this.resizeContexts(this._elWidth, this._elHeight);
        this.render();
    }

    /**
     * Resizes the timeline preview's rendering context.
     * @param width
     *  The new width.
     * @param height
     *  The new height. 
     */
    private resizeContexts(width: number, height: number) {
        if(!this._context) {
            return;
        }
        // Resize context
        resizeContext(this._context, width, height);
        // Reapply base styling
        styleContext(this._context, {
            textAlign: "right",
            lineWidth: 1
        });
    }



    ///////////////////////////////////////////////////////////////////////////
    //  4. Timeline Preview Data  /////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Sets the timeframe the timeline preview covers.
     * @param timeframe
     *  The timeframe the timeline preview covers.
     */
    public setTimeframeCoverage(timeframe: Timeframe) {
        // Update timeframe
        this._timeframe = timeframe;
        // Update preview sizing
        this.updatePreviewSizing();
    }

    /**
     * Sets the lanes that make up the timeline preview.
     * @param lanes
     *  The set of lanes that make up the timeline preview.
     */
    public setLanes(lanes: GenericTimelineLane[]) {
        this._lanes = lanes;
        // Run preview layout
        this.runLayout();
    }

    /**
     * Computes the preview's layout.
     */
    private runLayout() {
        let h = this._$.header;
        let p = this._$.preview;
        // Compute number of lanes
        let lanes = 0;
        for (let lane of this._lanes)
            if (lane.isVisible()) lanes++;
        let ph = this._elHeight - h.height - (2 * p.verticalPadding);
        // Compute tick height and x offset
        this._tickHeight = clamp(Math.floor(ph / lanes), 1, 8);
        this._tickOffsetX = this._$.preview.tickWidth >> 1;
        // Note: 'ph' = preview height
    }

    /**
     * Updates the preview's sizing.
     */
    private updatePreviewSizing() {
        let miw = this._$.ticker.minimumIntervalWidth;
        // Fit timeframe within an interval
        this._fit = fitTimeframeInInterval(this._timeframe, this._elWidth, miw);
        this._tfBegPx = calculatePixelAtTime(this._fit, this._elWidth, this._timeframe.beg);
        this._tfBegPx = Math.round(this._tfBegPx);
        this._tfEndPx = calculatePixelAtTime(this._fit, this._elWidth, this._timeframe.end);
        this._tfEndPx = Math.round(this._tfEndPx);
        // Update current detail level
        this._detailLevel = 
            this._fit.intervalDur >= Time.Minute ? 0 : 
            this._fit.intervalDur >= Time.Second ? 1 : 2;
    }

}

export type TimelinePreviewStyle = {
    backgroundColor: string;
    hatchColor: string;
    header: {
        height: number;
        fillColor: string;
        strokeColor: string;
    },
    ticker: {
        dateFont: FontDescriptor;
        timeFont: FontDescriptor;
        textSidePadding: number;
        lineColor: string;
        minimumIntervalWidth: number;
    }
    preview: {
        verticalPadding: number;
        tickWidth: number;
    }
}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Class types
type TimelinePreviewComputedStyle = TimelinePreviewStyle & {
    ticker: {
        dateFontCss: string,
        timeFontCss: string
    }
}
