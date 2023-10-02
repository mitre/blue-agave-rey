import { clamp } from "../../Math";
import { Device } from "../../WebUtilities/Device";
import { ColorMap } from "../VisualAttributeValues";
import { TimelineLane } from "./TimelineLane";
import { TimelineTick } from "./TimelineTick";
import { EventEmitter } from "../EventEmitter";
import { GenericViewNode } from "../ViewBaseTypes/GenericViewNode";
import { createHatchPattern } from "../Patterns";
import { ChronologicalIndex } from "../../Collections/ChronologicalIndex";
import { GenericTimelineLane } from "../ViewBaseTypes/GenericTimelineLane";
import { ITimeframe, Timeframe } from "../../Collections/Timeframe";
import { resizeContext, styleContext } from "../Canvas";
import { FontDescriptor, FontLoader } from "../Fonts";
import { FillColorMask, Stroke2ColorMask } from "../VisualAttributes";
import { findLayerSegments, getSimpleVisualPriority as gsvp } from "../Layers";
import { 
    Time,
    formatDate,
    format12HourTime, 
    format24HourTime,
    calculatePixelAtMs,
    calculatePixelAtTime,
    calculateTimeAtPixel,
    timeDurationFromWidth,
    fitIntervalInTimeframe
} from "../Time";

export class Timeline extends EventEmitter<TimelineEvents> {

    private static readonly ZOOM_SCALE = 2.5;
    private static readonly VIEWPORT_PADDING = 5;
    private static readonly LANE_SEPARATOR_HEIGHT = 1;

    // Timeline Fields
    private _$: TimelineComputedStyle
    private _rafId: number;
    private _elWidth: number;
    private _tlWidth: number;
    private _elHeight: number;
    private _tlHeight: number;
    private _laneCtx: CanvasRenderingContext2D | null;
    private _timeCtx: CanvasRenderingContext2D | null;
    private _tickCtx: CanvasRenderingContext2D | null;
    private _viewport: number[];
    private _highlight: HighlightParams;
    private _tlOffsetX: number;
    private _tlOffsetY: number;
    private _mouseState: MouseState;
    private _tlContainer: HTMLElement | null;
    private _intervalDur: number;
    private _detailLevel: number;
    private _scrollHeight: number;
    private _hatchPattern: CanvasPattern;
    private _intervalRange: number[];
    private _fullRenderMode: boolean;
    private _onResizeObserver: ResizeObserver | null;
    
    // Data Fields
    private _lanes: TimelineLane[];
    private _ticks: TimelineTick[];
    private _focus: Timeframe;
    private _layers: TimelineLayers;
    private _timeframe: Timeframe;
    private _timeIndex: ChronologicalIndex<TimelineTick>;
    private _formatTime: (date: Date, level: number) => string;


    /**
     * Creates a new Timeline.
     */
    constructor() {
        super();

        // Configure night time
        let night = { beg: new Date(0), end: new Date(0) };
        night.beg.setHours(12);
        night.end.setHours(0);

        // Setup timeline state
        this._rafId = 0;
        this._tlWidth = 0;
        this._elWidth = 0;
        this._tlHeight = 0;
        this._elHeight = 0;
        this._laneCtx = null;
        this._timeCtx = null;
        this._tickCtx = null;
        this._viewport = [-Timeline.VIEWPORT_PADDING,0];
        this._highlight = { tf: null, off: 0, beg: 0, dur: 0 };
        this._tlOffsetX = 0;
        this._tlOffsetY = 0;
        this._mouseState = { dragging: false, hovering: false };
        this._tlContainer = null;
        this._detailLevel = 0;
        this._scrollHeight = 0;
        this._intervalRange = [0, 0];
        this._fullRenderMode = false;
        this._onResizeObserver = null;

        // Setup data state
        this._lanes = [];
        this._ticks = [];
        this._focus = Timeframe.TODAY.copy();
        this._layers = { major: [], minor: [] }
        this._timeframe = Timeframe.TODAY.copy();
        this._timeIndex = new ChronologicalIndex();
        this._formatTime = format12HourTime;

        // Set highlighting timeframe
        this.setDayTimeframe(night);

        // Set default style
        this._$ = {
            backgroundColor: "#2b2b2b",
            alternatingColor: "#1a1a1a",
            lanesTopPadding: 1, 
            header: { 
                height: 32, 
                fillColor: "#212121",
                strokeColor: "#0f0f0f",
            },
            ticker: {
                dateFont: { 
                    lineHeight: 12,
                    family: "monospace",
                    color: "#808080",
                    size: "8.25pt",
                },
                timeFont: { 
                    lineHeight: 14,
                    family: "monospace",
                    color: "#bfbfbf",
                    size: "9pt", 
                },
                dateFontCss: "",
                timeFontCss: "",
                textSidePadding: 5,
                lineColor: "#383838",
                minimumIntervalWidth: 120
            },
            lanes: {
                font: {
                    lineHeight: 9,
                    family: "sans-serif",
                    color: "#949494",
                    size: "9pt"
                },
                textSidePadding: 7,
                lineColor: "#383838",
                innerLaneGap: 10
            },
            ticks: { width: 3, gap: 2 }
        };
        this._$.ticker.dateFontCss = 
            FontLoader.getCssFontString(this._$.ticker.dateFont);
        this._$.ticker.timeFontCss = 
            FontLoader.getCssFontString(this._$.ticker.timeFont);
        this._hatchPattern = 
            createHatchPattern(0.5, 1.5, this._$.backgroundColor, this._$.alternatingColor);
        this._intervalDur = 
            fitIntervalInTimeframe(this._timeframe, 0, this._$.ticker.minimumIntervalWidth);
        
    }


    ///////////////////////////////////////////////////////////////////////////
    //  1. Inject, Destroy, and Configuration  ////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Injects the timeline into a container.
     * @param container
     *  The container to inject the timeline into.
     * @returns
     *  The Timeline.
     * @throws { TextMeasurementError }
     *  If the lane font has not been loaded.
     */
    public inject(container: HTMLElement): Timeline {

        // Get sizing
        this._elWidth = container.clientWidth;
        this._elHeight = container.clientHeight;

        // Setup Timeline container
        this._tlContainer = document.createElement("div");
        this._tlContainer.style.position = "relative";
        this._tlContainer.oncontextmenu = e => e.preventDefault();

        // Setup canvas & context
        let timeCan = this.createCanvas(this._elWidth, this._$.header.height)
        let tickCan = this.createCanvas(this._elWidth, this._elHeight, this._$.header.height);
        let laneCan = this.createCanvas(this._elWidth, this._elHeight, this._$.header.height);
        this._timeCtx = timeCan.getContext("2d", { alpha: false })!;
        this._tickCtx = tickCan.getContext("2d", { alpha: false })!;
        this._laneCtx = laneCan.getContext("2d", { alpha: true })!;

        // Size context
        resizeContext(this._timeCtx, this._elWidth, this._elHeight);
        resizeContext(this._tickCtx, this._elWidth, this._elHeight);
        resizeContext(this._laneCtx, this._elWidth, this._elHeight);

        // Configure resize observer
        this._onResizeObserver = new ResizeObserver(
            entries => this.onCanvasResize(entries[0].target)
        );
        this._onResizeObserver.observe(container);

        // Configure dppx change behavior
        Device.on("dppx-change", this.onDevicePixelRatioChange, this);

        // Configure canvas interactions
        laneCan.addEventListener("pointerdown", e => this.onCanvasPointerDown(e));
        laneCan.addEventListener("mousemove", e => this.onCanvasMouseMove(e));
        timeCan.addEventListener("mousemove", _ => this.onTimeCanvasMouseMove());
        laneCan.addEventListener("dblclick", e => this.onCanvasDoubleClick(e))
        laneCan.addEventListener("wheel", e => this.onCanvasWheel(e), { passive: true });

        // Apply base styling
        styleContext(this._timeCtx, {
            textAlign: "right",
            lineWidth: 1
        });
        styleContext(this._laneCtx, {
            font: FontLoader.getCssFontString(this._$.lanes.font),
            fillStyle: this._$.lanes.font.color!,
            strokeStyle: this._$.lanes.lineColor,
            lineWidth: Timeline.LANE_SEPARATOR_HEIGHT
        });
                
        // Update viewport window
        this._viewport[1] = this._elWidth + Timeline.VIEWPORT_PADDING;

        // Run layout
        this.runLayout(true);

        // Update timeline viewport
        this.updateViewportSizingAndOffset();

        // Inject timeline
        this._tlContainer.appendChild(tickCan);
        this._tlContainer.appendChild(laneCan);
        this._tlContainer.appendChild(timeCan)
        container.appendChild(this._tlContainer);

        // Return Timeline
        return this;
    }

    /**
     * Removes the timeline from the container and removes all event listeners.
     * @returns
     *  The Timeline.
     */
    public destroy(): Timeline {
        this._tlContainer?.remove();
        this._tlContainer = null;
        this._timeCtx = null;
        this._tickCtx = null;
        this._laneCtx = null;
        this._mouseState.dragging = false;
        this._mouseState.hovering = false;
        this.removeAllListeners("node-click");
        this.removeAllListeners("node-dblclick");
        this.removeAllListeners("node-mouseenter");
        this.removeAllListeners("node-mouseleave");
        this.removeAllListeners("canvas-click");
        this.removeAllListeners("canvas-drag");
        this.removeAllListeners("canvas-zoom");
        this._onResizeObserver?.disconnect();
        Device.removeEventListenersWithContext(this);
        return this;
    }

    /**
     * Sets the timeline's styling.
     * @param style
     *  The timeline's style parameters.
     * @returns
     *  A Promise that resolves with the Timeline once the styling has been
     *  applied.
     * @throws { TextMeasurementError }
     *  If the lane font has not been loaded.
     */
    public async setTimelineStyle(style: TimelineStyle): Promise<Timeline> {
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
            },
            lanes: {
                ...style.lanes,
                font: {
                    color: "#000",
                    lineHeight: 9,
                    ...style.lanes.font
                }
            }
        };
        // Update context base style, if possible
        if (this._laneCtx) {
            styleContext(this._laneCtx, {
                font: FontLoader.getCssFontString(this._$.lanes.font),
                fillStyle: this._$.lanes.font.color!,
                strokeStyle: this._$.lanes.lineColor,
            });
        }
        // Load required fonts
        try {
            await FontLoader.load(this._$.lanes.font);
            await FontLoader.load(this._$.ticker.dateFont);
            await FontLoader.load(this._$.ticker.timeFont);
        } catch(ex: any) {
            console.error(ex.message);
        }
        // Update hatch pattern
        this._hatchPattern = 
            createHatchPattern(0.5, 1.5, this._$.backgroundColor, this._$.alternatingColor);
        // Run layout
        this.runLayout(true);
        // Update timeline viewport
        this.updateViewportSizingAndOffset();
        // Return Timeline
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
     *  The Timeline.
     */
    public setDisplay24HourTime(value: boolean): Timeline {
        this._formatTime = value ? format24HourTime : format12HourTime;
        return this;
    }

    /**
     * Sets the timeframe that's highlighted each day.
     * 
     * NOTE:
     * The duration of a day is automatically capped at 24 hours. Therefore,
     * you should select a start and end time that occur on the same date.
     * To invert the highlighted timeframe, simply swap the start and end time.
     * 
     * @param timeframe
     *  The timeframe that should be highlighted each day.
     *  Use `null` to disable highlighting.
     * @returns
     *  The Timeline.
     */
    public setDayTimeframe(timeframe: ITimeframe | null): Timeline {
        this._highlight.tf = timeframe;
        if(timeframe) {
            // [NOTE_1]:
            // Using the timeline's beg date to offset the highlight timeframe
            // into the correct timezone. (Only until the Timeline's timezone
            // can be set explicitly. Highlighting should account for DST.)
            // This is a temporary solution.
            let beg = new Date(this._timeframe.beg);
            beg.setHours(timeframe.end.getHours());
            beg.setMinutes(timeframe.end.getMinutes());
            beg.setSeconds(timeframe.end.getSeconds());
            beg.setMilliseconds(0);
            let end = new Date(this._timeframe.beg);
            end.setHours(timeframe.beg.getHours());
            end.setMinutes(timeframe.beg.getMinutes());
            end.setSeconds(timeframe.beg.getSeconds());
            end.setMilliseconds(0);
            // Update repeat highlight parameters
            this._highlight.dur = Math.abs(beg.getTime() - end.getTime());
            if(end < beg) {
                this._highlight.dur = Time.Day - Math.min(this._highlight.dur, Time.Day);
            } else {
                this._highlight.dur = Math.min(this._highlight.dur, Time.Day);
            }
            this._highlight.off = beg.getTime() % Time.Day;
            // Calculate highlight starting position
            let foc = this._focus.beg.getTime();
            this._highlight.beg = foc - ((foc - this._highlight.off) % Time.Day);
            if(this._highlight.beg + this._highlight.dur < foc)
                this._highlight.beg += Time.Day;
        }
        return this;
    }

    /**
     * Creates a new HTMLCanvasElement of the specified size. 
     * @param w
     *  The width of the canvas element.
     * @param h
     *  The height of the canvas element (including top padding).
     * @param padding
     *  The amount of padding to add to the top.
     *  (Default: 0)
     * @returns
     *  The configured Canvas element.
     */
    private createCanvas(w: number, h: number, padding: number = 0): HTMLCanvasElement {
        let canvas = document.createElement("canvas");
        canvas.style.cssText = `position:absolute;display:block;top:${ padding }px`
        canvas.height = h - padding;
        canvas.width = w;
        return canvas;
    }


    ///////////////////////////////////////////////////////////////////////////
    //  2. Rendering  /////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Renders the timeline.
     * @param full
     *  If true, each lane's label will be redrawn.
     *  (Default: false)
     */
    public render(full: boolean = false) {
        this._fullRenderMode ||= full;
        if (this._rafId != 0)
            return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = 0;
            this.executeRenderPipeline(this._fullRenderMode);
            this._fullRenderMode = false;
        })
    }

    /**
     * Executes the timeline rendering pipeline.
     * @param full
     *  If true, each lane's label will be redrawn.
     */
    private executeRenderPipeline(full: boolean) {

        // Return if there's no context to render to
        if (this._timeCtx === null)
            return;

        // Initialize render state
        let { lanes, header, ticker, ticks } = this._$;
        let l = this._layers;
        let range = this._intervalRange;
        let height = this._elHeight - header.height;

        // Draw lanes if full render requested
        if(full) {
            let p = lanes.textSidePadding, y, lh = lanes.font.lineHeight! >> 1;
            this._laneCtx!.clearRect(0, 0, this._elWidth, height);
            this._laneCtx!.beginPath();
            for(let lane of this._lanes) {
                y = lane.y - this._tlOffsetY;
                this._laneCtx!.fillText(lane.name, p, y + lh);
                this._laneCtx!.moveTo(p + lane.nameWidth + p, y - 0.5);
                this._laneCtx!.lineTo(this._elWidth, y - 0.5);
            }
            this._laneCtx!.stroke();
        }

        // Clear tick canvas
        this._tickCtx!.fillStyle = this._$.backgroundColor;
        this._tickCtx!.fillRect(0, 0, this._elWidth, height);

        // Draw highlighted time regions
        if(this._highlight.tf !== null) {
            let wid;
            let dur = this._highlight.dur;
            let beg = this._highlight.beg;
            let end = this._focus.end.getTime();
            this._tickCtx!.fillStyle = this._hatchPattern;
            for(let x1, x2; beg < end; beg += Time.Day) {
                x1 = calculatePixelAtMs(this._timeframe, this._tlWidth, beg);
                x1 = Math.round(x1) - this._tlOffsetX;
                x2 = calculatePixelAtMs(this._timeframe, this._tlWidth, beg + dur);
                x2 = Math.round(x2) - this._tlOffsetX;
                wid = x2 - x1;
                if(x1 < 0) wid += x1, x1 = 0;
                this._tickCtx!.fillRect(x1, 0, Math.min(wid, this._elWidth), height);
            }
        }
        
        // Draw header
        this._timeCtx.fillStyle = header.fillColor;
        this._timeCtx.strokeStyle = header.strokeColor;
        this._timeCtx.fillRect(0, 0, this._elWidth, header.height);
        this._timeCtx.beginPath();
        this._timeCtx.moveTo(0, header.height - 0.5);
        this._timeCtx.lineTo(this._elWidth, header.height - 0.5);
        this._timeCtx.stroke();
        
        // Draw time ticker
        let xr;
        let time = new Date(0);
        this._timeCtx!.font = ticker.dateFontCss;
        this._timeCtx!.fillStyle = ticker.dateFont.color!;
        this._timeCtx!.strokeStyle = ticker.lineColor;
        this._tickCtx!.strokeStyle = ticker.lineColor;
        this._tickCtx!.lineWidth = 1;
        this._timeCtx!.beginPath();
        this._tickCtx!.beginPath();
        for(let i = range[0]; i <= range[1]; i += this._intervalDur) {
            // Set time
            time.setTime(i);
            // Lines
            xr = calculatePixelAtMs(this._timeframe, this._tlWidth, i);
            xr = Math.round(xr) - this._tlOffsetX;
            this._timeCtx!.moveTo(xr + 0.5, 0);
            this._timeCtx!.lineTo(xr + 0.5, header.height);
            this._tickCtx!.moveTo(xr + 0.5, 0);
            this._tickCtx!.lineTo(xr + 0.5, height);
            // Date
            this._timeCtx.fillText(
                formatDate(time),
                xr - ticker.textSidePadding, 
                ticker.dateFont.lineHeight!
            );
        }
        this._timeCtx!.stroke();
        this._tickCtx!.stroke();
        // Time
        this._timeCtx.font = ticker.timeFontCss;
        this._timeCtx.fillStyle = ticker.timeFont.color!;
        for(let i = range[0]; i <= range[1]; i += this._intervalDur) {
            // Set time
            time.setTime(i);
            // Draw
            xr = calculatePixelAtMs(this._timeframe, this._tlWidth, i);
            xr = Math.round(xr) - this._tlOffsetX;
            this._timeCtx.fillText(
                this._formatTime(time, this._detailLevel), 
                xr - ticker.textSidePadding,
                ticker.dateFont.lineHeight! + ticker.timeFont.lineHeight!
            );
        }

        // Draw unselected ticks
        let idx = 0;
        let minorIdx = 0;
        let x, tick, style;
        this._tickCtx!.lineWidth = ticks.width;
        for(; idx < l.major[0]; minorIdx++) {
            style = ColorMap[this._ticks[idx].obj.style & FillColorMask];
            this._tickCtx!.strokeStyle = style;
            this._tickCtx!.beginPath();
            for (;idx < l.minor[minorIdx]; idx++) {
                tick = this._ticks[idx];
                x = tick.x - this._tlOffsetX;
                if(this._viewport[0] < x && x < this._viewport[1]) {
                    this._tickCtx!.moveTo(x, tick.y0 - this._tlOffsetY);
                    this._tickCtx!.lineTo(x, tick.y1 - this._tlOffsetY);
                }
            }
            this._tickCtx!.stroke();
        }

        // Draw selected ticks
        if(idx < l.major[1]) {
            let y, h;
            style = ColorMap[(this._ticks[idx].obj.style & Stroke2ColorMask) >>> 4];
            let rectOffset = ticks.width / 2;
            this._tickCtx!.lineWidth = 2;
            this._tickCtx!.strokeStyle = style;
            for(; idx < l.major[1]; idx++) {
                tick = this._ticks[idx];
                x = tick.x - this._tlOffsetX - rectOffset;
                y = tick.y0 - this._tlOffsetY;
                if(this._viewport[0] < x && x < this._viewport[1]) {
                    h = tick.y1 - tick.y0;
                    this._tickCtx!.fillStyle = this._$.backgroundColor;
                    this._tickCtx!.fillRect(x - 6, y - 6, ticks.width + 12, h + 12);
                    this._tickCtx!.fillStyle = ColorMap[tick.obj.style & FillColorMask];
                    this._tickCtx!.fillRect(x, y, ticks.width, h);
                    this._tickCtx!.strokeRect(x - 3, y - 3, ticks.width + 6, h + 6);
                }
            }
        }

    }


    ///////////////////////////////////////////////////////////////////////////
    //  3. Canvas Interactions  ///////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////


    /**
     * Returns the events located at the given timeline coordinates.
     * @param x
     *  The x coordinate.
     * @param y
     *  The y coordinate.
     * @returns
     *  `null` if no events exist at that location or:
     *  [matches]
     *   The events located at the specified coordinates.
     *  [tick]
     *   The Timeline tick closest to the specified coordinates (in time).
     */
    private selectSubject(
        x: number, y: number
    ): { matches: GenericViewNode[], tick: TimelineTick } | null {
        let rOffset = this._$.ticks.width >> 1;
        let lOffset = rOffset - (this._$.ticks.width % 2 === 0 ? 1 : 0);
        let minX = calculateTimeAtPixel(this._timeframe, this._tlWidth, x - lOffset);
        let maxX = calculateTimeAtPixel(this._timeframe, this._tlWidth, x + rOffset);
        // Get nodes on the x-axis
        let nodes = this._timeIndex.search(new Date(minX), new Date(maxX));
        // Filter nodes on the y-axis
        let matches = [];
        let tick: TimelineTick;
        for(let node of nodes) {
            if(node.y0 <= y && y < node.y1) {
                matches.push(node.obj);
                tick = node;
            }
        }
        // Return results
        return matches.length > 0 ? { matches, tick: tick! } : null;
    }

    /**
     * Canvas pointer down behavior.
     * @param event
     *  The pointer down event.
     */
    private onCanvasPointerDown(event: PointerEvent) {
        
        // Timeline position
        let x = this._tlOffsetX + event.offsetX;
        let y = this._tlOffsetY + event.offsetY;

        // Container position
        let offsetX = event.offsetX;
        let offsetY = event.offsetY + this._$.header.height;
        
        // Attempt select subject
        let s = this.selectSubject(x, y);
        if(s !== null) {
            this.emit("node-click", event, s.matches, offsetX, offsetY);
            return;
        }
        
        // Update mouse state
        this._mouseState.dragging = true;
        // Emit canvas click event
        this.emit("canvas-click", event, offsetX, offsetY);
        
        // Configure drag
        let lastY = 0;
        let nextY = 0;
        let clientX = event.clientX;
        let clientY = event.clientY;
        let movementX = 0;
        let movementY = 0;
        
        let target = event.target! as HTMLCanvasElement;
        target.onpointermove = e => {
            e.preventDefault();
            // Calculate movementX and movementY
            movementX = e.clientX - clientX;
            movementY = e.clientY - clientY;
            clientX = e.clientX;
            clientY = e.clientY;
            // Update scroll position
            lastY = this._tlOffsetY;
            nextY = clamp(this._tlOffsetY - movementY, 0, this._scrollHeight);
            this._tlOffsetY = nextY;
            // Force full render mode next paint, if required
            if(nextY - lastY !== 0) this._fullRenderMode = true;
            // Update timeline
            if(movementX !== 0) {
                let t = timeDurationFromWidth(this._timeframe, this._tlWidth, movementX);
                // Move time must be at least 1 millisecond
                if(t < 0)
                    t = Math.min(-1, t);
                else if(0 < t)
                    t = Math.max(1, t);
                // Emit canvas drag event
                this.emit("canvas-drag", -t);
            } else if(nextY - lastY !== 0) {
                this.render();
            }
        }
        target.setPointerCapture(event.pointerId);
        
        // Configure release
        document.addEventListener("pointerup", event => {
            target.onpointermove = null;
            target.releasePointerCapture(event.pointerId);
            // Update mouse state
            this._mouseState.dragging = false;
        }, { once: true })

    }

    /**
     * Canvas double click behavior.
     * @param event
     *  The click event.
     */
    private onCanvasDoubleClick(event: MouseEvent) {
        // Timeline position
        let x = this._tlOffsetX + event.offsetX;
        let y = this._tlOffsetY + event.offsetY;
        // Attempt select subject
        let s = this.selectSubject(x, y);
        if(s !== null) {
            this.emit("node-dblclick", event, s.matches);
        }
    }

    /**
     * Canvas mouse move behavior.
     * @param event
     *  The mouse event.
     */
    private onCanvasMouseMove(event: MouseEvent) {
        if(this._mouseState.dragging) return;
        let x = this._tlOffsetX + event.offsetX;
        let y = this._tlOffsetY + event.offsetY;
        let s = this.selectSubject(x, y);
        if(s !== null) {
            this._mouseState.hovering = true;
            // Compute the last tick's bounding box.
            let top = s.tick.y0 - this._tlOffsetY + this._$.header.height;
            let left = s.tick.x - this._tlOffsetX - (this._$.ticks.width / 2);
            let right = left + this._$.ticks.width;
            let bottom = top + (s.tick.y1 - s.tick.y0);
            let tickBoundingBox = { top, left, right, bottom };
            // Emit hover event
            this.emit("node-mouseenter", s.matches, tickBoundingBox);
        } else if(this._mouseState.hovering) {
            this._mouseState.hovering = false;
            this.emit("node-mouseleave");
        }
    }

    /**
     * Time canvas mouse move behavior.
     */
    private onTimeCanvasMouseMove() {
        if(this._mouseState.hovering) {
            this._mouseState.hovering = false;
            this.emit("node-mouseleave");
        }
    }

    /**
     * Canvas mouse wheel behavior.
     * @param event
     *  The wheel event.
     */
    private onCanvasWheel(event: WheelEvent) {
        this.emit("canvas-zoom",
            calculateTimeAtPixel(
                this._timeframe, this._tlWidth, this._tlOffsetX + event.offsetX
            ),
            timeDurationFromWidth(
                this._timeframe, this._tlWidth, -event.deltaY * Timeline.ZOOM_SCALE
            )
        );
    }

    /**
     * Canvas resize behavior.
     * @param el
     *  The timeline's container.
     */
    private onCanvasResize(el: Element) {
        let padding = this._$.header.height;
        let newWidth = el.clientWidth;
        this._elHeight = el.clientHeight;
        let height = Math.max(0, this._elHeight - padding);
        // Update scroll height and position
        this._scrollHeight = Math.max(0, this._tlHeight - height);
        this._tlOffsetY = clamp(this._tlOffsetY, 0, this._scrollHeight);
        // Update canvas dimensions
        this.resizeContexts(newWidth, this._elHeight);
        if(this._elWidth !== newWidth) {
            // Update width
            this._elWidth = newWidth;
            // Update viewport window
            this._viewport[1] = this._elWidth + Timeline.VIEWPORT_PADDING;
            // Update timeline viewport
            this.updateViewportSizingAndOffset();
        }
        // Immediately redraw timeline to context, if possible
        if (this._timeCtx)
            this.executeRenderPipeline(true);
    }
    
    /**
     * Device pixel ratio change behavior.
     * @remarks
     *  The device's pixel ratio can change when dragging the window to and
     *  from a monitor with high pixel density (like Apple Retina displays).
     */
    private onDevicePixelRatioChange() {
        this.resizeContexts(this._elWidth, this._elHeight);
        this.render(true);
    }

    /**
     * Resizes the timeline's rendering contexts.
     * @param width
     *  The new width.
     * @param height
     *  The new height. 
     */
    private resizeContexts(width: number, height: number) {
        if(!this._timeCtx) {
            return;
        }
        let padding = this._$.header.height;
        height = Math.max(0, height - padding);
        // Resize contexts
        resizeContext(this._timeCtx!, width, padding);
        resizeContext(this._tickCtx!, width, height);
        resizeContext(this._laneCtx!, width, height);
        // Reapply base styling
        styleContext(this._timeCtx!, {
            textAlign: "right",
            lineWidth: 1
        });
        styleContext(this._laneCtx!, {
            font: FontLoader.getCssFontString(this._$.lanes.font),
            fillStyle: this._$.lanes.font.color!,
            strokeStyle: this._$.lanes.lineColor,
            lineWidth: Timeline.LANE_SEPARATOR_HEIGHT
        });
    }


    ///////////////////////////////////////////////////////////////////////////
    //  4. Timeline Data  /////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    

    /**
     * Sets the timeline's total timeframe.
     * @param timeframe
     *  The total timeframe of the timeline.
     */
    public setTimeframe(timeframe: Timeframe) {
        // Update timeframe
        this._timeframe = timeframe.copy();
        // Correct highlight offset (Temporary - See NOTE_1)
        this.setDayTimeframe(this._highlight.tf);
        // Update timeline viewport
        this.updateViewportSizingAndOffset();
    }

    /**
     * Sets the lanes that make up the timeline.
     * @param lanes
     *  The set of lanes that make up the timeline.
     * @throws { TextMeasurementError }
     *  If the lane font has not been loaded.
     */
    public setLanes(lanes: GenericTimelineLane[]) {
        // Clear lanes
        this._lanes = [];
        // Create lanes
        for (let lane of lanes) {
            if (!lane.isVisible())
                continue;
            this._lanes.push({
                name: lane.id.toLocaleUpperCase(),
                nameWidth: 0,
                y: 0,
                obj: lane
            })
        }
        // Run timeline layout
        this.runLayout();
    }

    /**
     * Sets the timeline's focus region.
     * @param time
     *  The timeframe to focus on.
     */
    public setFocus(time: Timeframe) { 
        let tFocus = this._focus;
        // Update focus
        this._focus = time.copy();
        // Update timeline viewport
        if(this._focus.areEqualDuration(tFocus)) {
            this.updateViewportOffset();
        } else {
            this.updateViewportSizingAndOffset();
        }
    }

    /**
     * Computes the timeline's layout.
     * @param skipPlotTicksPhase
     *  If true, the timeline's ticks won't be replotted across the x-axis.
     *  (Default: false)
     * @throws { TextMeasurementError }
     *  If the lane font has not been loaded.
     */
    private runLayout(skipPlotTicksPhase: boolean = false) {
        // Clear ticks and time index
        this._ticks = [];
        this._timeIndex.clear();
        // Calculate layout (y-axis)
        let $ = this._$;
        let y = $.lanesTopPadding + $.lanes.innerLaneGap;
        for (let lane of this._lanes) {
            y += Timeline.LANE_SEPARATOR_HEIGHT;
            lane.y = y;
            y += $.lanes.innerLaneGap;
            for (let track of lane.obj.tracks) {
                for (let node of track.nodes) {
                    let tick = {
                        x: 0,
                        y0: y,
                        y1: y + track.height,
                        time: node.time,
                        obj: node
                    };
                    this._ticks.push(tick);
                    this._timeIndex.add(tick);
                }
                y += track.height + $.ticks.gap;
            }
            y += -$.ticks.gap + $.lanes.innerLaneGap;
        }
        this._tlHeight = y;
        // Calculate each lane name width
        for(let lane of this._lanes) {
            lane.nameWidth = FontLoader.measureWidth(
                lane.name, $.lanes.font
            );
        }
        // Update scroll height and position
        this._scrollHeight = Math.max(0, this._tlHeight + $.header.height - this._elHeight);
        this._tlOffsetY = clamp(this._tlOffsetY, 0, this._scrollHeight);
        // Plot ticks
        if(!skipPlotTicksPhase) {
            this.plotTicks();
        }
        // Refresh appearances
        this.refreshAppearances();
    }

    /*
     * Updates the appearance of all items in the timeline.
     * 
     * NOTE:
     * This function should be called anytime:
     *  - Ticks are selected / unselected.
     *  - Tick visual attributes are changed.
     * 
     */
    public refreshAppearances() {
        // Sort ticks by visual priority and appearance 
        this._ticks.sort((a: TimelineTick, b: TimelineTick) => {
            let major = 
                gsvp(a.obj.attrs) -
                gsvp(b.obj.attrs);
            return major === 0 ? 
                (a.obj.style & FillColorMask) - 
                (b.obj.style & FillColorMask)
                : major
        });
        // Locate tick layer boundaries
        let t = findLayerSegments(this._ticks, 2, FillColorMask, gsvp);
        this._layers.major = t.layers;
        this._layers.minor = t.bounds;
        // Note: 'gsvp' = get simple visual priority
    }

    /**
     * Updates the viewport's size and offset from the start of the timeframe.
     */
    private updateViewportSizingAndOffset() {
        let miw = this._$.ticker.minimumIntervalWidth;
        // Update timeline width
        this._tlWidth = this._timeframe.getInverseRatio(this._focus) * this._elWidth;
        // Fit interval within timeframe
        this._intervalDur = fitIntervalInTimeframe(this._timeframe, this._tlWidth, miw);
        // Update current detail level
        this._detailLevel = 
            this._intervalDur >= Time.Minute ? 0 : 
            this._intervalDur >= Time.Second ? 1 : 2;
        // Recalculate timeline offset
        this.updateViewportOffset();
        // Re-plot ticks
        this.plotTicks();
    }

    /**
     * Updates the viewport's offset from the start of the timeframe.
     */
    private updateViewportOffset() {
        // Update viewport's x offset
        this._tlOffsetX = calculatePixelAtTime(this._timeframe, this._tlWidth, this._focus.beg);
        this._tlOffsetX = Math.round(this._tlOffsetX);
        // Update interval range
        let int = this._intervalDur;
        let beg = this._focus.beg.getTime();
        let end = this._focus.end.getTime();
        // Round beg and end up to the nearest multiple of the interval
        this._intervalRange[0] = beg + int - 1 - (beg + int - 1) % int;
        this._intervalRange[1] = end + int - 1 - (end + int - 1) % int;
        // Update highlight start
        this._highlight.beg = beg - ((beg - this._highlight.off) % Time.Day);
        if(this._highlight.beg + this._highlight.dur < beg)
            this._highlight.beg += Time.Day;
    }

    /**
     * Plots the timeline's ticks along the x-axis (relative to the timeline's
     * duration and width).
     */
    private plotTicks() {
        let offset = this._$.ticks.width % 2 === 0 ? 0 : 0.5;
        for (let tick of this._ticks) {
            let x = calculatePixelAtTime(this._timeframe, this._tlWidth, tick.time);
            tick.x = Math.round(x) + offset;
        }
    }

}

export type TimelineStyle = {
    backgroundColor: string,
    alternatingColor: string,
    lanesTopPadding: number,
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
    },
    lanes: {
        font: FontDescriptor,
        textSidePadding: number,
        lineColor: string,
        innerLaneGap: number
    },
    ticks: {
        width: number,
        gap: number
    }
}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


// Event types
interface TimelineEvents {
    "node-click": (event: PointerEvent, node: GenericViewNode[], x: number, y: number) => void;
    "node-dblclick": (event: PointerEvent, node: GenericViewNode[]) => void;
    "node-mouseenter": (node: GenericViewNode[], boundingBox: BoundingBox) => void;
    "node-mouseleave": () => void;
    "canvas-click": (event: PointerEvent, x: number, y: number) => void;
    "canvas-drag": (duration: number) => void;
    "canvas-zoom": (focalTime: number, delta: number) => void;
}

// Class types
type TimelineLayers = {
    major: number[],
    minor: number[]
}
type HighlightParams = {
    tf: ITimeframe | null;
    off: number,
    dur: number,
    beg: number
}
type TimelineComputedStyle = TimelineStyle & {
    ticker: {
        dateFontCss: string,
        timeFontCss: string
    }
}
type MouseState = {
    dragging: boolean,
    hovering: boolean
}
type BoundingBox = {
    top: number,
    left: number,
    right: number,
    bottom: number
}
