import type { IChronologicalEvent } from "./IChronologicalEvent";

export class ChronologicalIndex<T extends IChronologicalEvent> {
    
    private _table: T[]

    /**
     * Creates a new ChronologicalIndex.
     */
    constructor() {
        this._table = [];
    }

    /**
     * Adds an IChronologicalEvent to the set.
     * @param item
     *  The IChronologicalEvent to add.
     */
    public add(item: T) {
        this._table.splice(this.getLeftmostItem(item.time), 0, item);
    }

    /**
     * Returns all events within the specified timeframe.
     * @param rangeBeg
     *  The search start time (inclusive).
     * @param rangeEnd
     *  The search end time (inclusive).
     * @returns
     *  All events that occurred within the timeframe.
     */
    public search(rangeBeg: Date, rangeEnd: Date): T[] {
        return this._table.slice(
            this.getLeftmostItem(rangeBeg),
            this.getRightmostItem(rangeEnd) + 1
        );
    }

    /**
     * Finds the event that occurred immediately before the given time.
     * @param time
     *  The time to evaluate.
     * @returns
     *  The time of the event or `undefined` if no such event exists.
     */
    public getPrevTimeStep(time: Date): Date | undefined{
        let offset = new Date(time.getTime() - 1);
        return this._table[Math.max(0, this.getRightmostItem(offset))]?.time
    }

    /**
     * Finds the event that occurred immediately after the given time.
     * @param time
     *  The time to evaluate.
     * @returns 
     *  The time of the event or `undefined` if no such event exists.
     */
    public getNextTimeStep(time: Date): Date | undefined {
        let offset = new Date(time.getTime() + 1);
        let max = this._table.length - 1;
        return this._table[Math.min(this.getLeftmostItem(offset), max)]?.time;
    }

    /**
     * Empties the index of all events.
     */
    public clear() {
        this._table = [];
    }

    /**
     * Searches for the specified time in the set. If there are multiple events
     * at the requested time, the leftmost match is returned.
     * @param time
     *  The time to search for.
     * @returns 
     *  The index of the leftmost match.
     */
    private getLeftmostItem(time: Date): number {
        let l = 0;
        let r = this._table.length;
        let m = 0;
        while(l < r) {
            m = (l + r) >> 1;
            if(this._table[m].time < time)
                l = m + 1;
            else 
                r = m;
        }
        return l;
    }

    /**
     * Searches for the specified time in the set. If there are multiple events
     * at the requested time, the rightmost match is returned.
     * @param time
     *  The time to search for.
     * @returns 
     *  The index of the rightmost match.
     */
    private getRightmostItem(time: Date): number {
        let l = 0
        let r = this._table.length;
        let m = 0;
        while(l < r) {
            m = (l + r) >> 1;
            if(this._table[m].time > time)
                r = m
            else
                l = m + 1
        }
        return r - 1
    }

}
