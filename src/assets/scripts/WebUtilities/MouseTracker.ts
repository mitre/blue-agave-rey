export class MouseTracker {

    /**
     * The X coordinate of the mouse relative to the starting position.
     */
    public deltaX: number;

    /**
     * The Y coordinate of the mouse relative to the starting position.
     */
    public deltaY: number;

    /**
     * The X coordinate of the mouse relative to the last mouse move event.
     */
    public movementX: number;

    /**
     * The Y coordinate of the mouse relative to the last mouse move event.
     */
    public movementY: number;
    
    /**
     * The drag target.
     */
    public target: HTMLElement | null;

    private _originX: number;
    private _originY: number;
    private _lastX: number;
    private _lastY: number;

    /**
     * Creates a new MouseTracker.
     */
    constructor() {
        this.deltaX = 0;
        this.deltaY = 0;
        this.movementX = 0;
        this.movementY = 0;
        this.target = null;
        this._originX = 0;
        this._originY = 0;
        this._lastX = 0;
        this._lastY = 0;
    }

    /**
     * Captures the pointer and resets the mouse tracker.
     * @param event
     *  The pointer down event.
     * @param callback
     *  The function to call on mouse movement.
     */
    public capture(event: PointerEvent, callback: (e: PointerEvent, t: MouseTracker) => void) {
        this._originX = event.clientX;
        this._originY = event.clientY;
        this._lastX = this._originX;
        this._lastY = this._originY;
        this.target = event.target as HTMLElement;
        this.target.setPointerCapture(event.pointerId);
        this.target.onpointermove = (e) => {
            this.update(e);
            callback(e, this);
        };
    }

    /**
     * Updates the pointer tracker.
     * @param event
     *  The pointer move event.
     */
    private update(event: PointerEvent) {
        this.deltaX = event.clientX - this._originX;
        this.deltaY = event.clientY - this._originY;
        this.movementX = event.clientX - this._lastX;
        this.movementY = event.clientY - this._lastY;
        this._lastX = event.clientX;
        this._lastY = event.clientY;
    }

    /**
     * Releases the current pointer.
     * @param event
     *  The pointer up event.
     */
    public release(event: PointerEvent) {
        if(this.target !== null) {
            this.target.releasePointerCapture(event.pointerId);
            this.target.onpointermove = null;
            this.target = null;
        }
    }

}
