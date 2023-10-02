export interface ITimeframe {
    beg: Date,
    end: Date
}

export class Timeframe implements ITimeframe {

    public beg: Date;
    public end: Date;

    /**
     * Today
     */
    public static TODAY = new Timeframe(24);

    /**
     * Creates a new Timeframe.
     * @param length
     *  The length of the timeframe (in hours).
     */
    constructor(length: number)

    /**
     * Creates a new Timeframe.
     * @param beg
     *  The timeframe's start.
     * @param end
     *  The timeframe's end.
     */
    constructor(beg: Date, end: Date)
    constructor(beg: any, end?: any) {
        if(beg.constructor.name === Number.name) {
            this.end = new Date();
            // 1 Hour = 3.6e+6 Milliseconds
            this.beg = new Date(this.end.getTime() - (beg * 3.6e+6));
        } else {
            this.beg = this.cloneDate(beg)
            this.end = (end === undefined) ? this.cloneDate(this.beg) : this.cloneDate(end)
        }
    }

    /**
     * Clones the specified date.
     * @param date
     *  The date to clone.
     * @returns 
     *  The cloned date.
     */
    private cloneDate(date: Date): Date {
        return new Date(date);
    }

    /**
     * Returns the duration of the timeframe.
     * @returns
     *  The duration of the timeframe in milliseconds.
     */
    public getDuration(): number {
        return this.end.getTime() - this.beg.getTime();
    }

    /**
     * Returns how far (in milliseconds) the given date is from the start of
     * the timeframe.
     * @param date
     *  The date to evaluate.
     * @returns 
     *  How far (in milliseconds) the date is from the start of the timeframe.
     */
    public getTimeFromStart(date: Date): number {
        return date.getTime() - this.beg.getTime();
    }

    /**
     * Returns the time at the given percentage.
     * 
     * **Example**
     * 
     * - `getTimeAtPercent(0)` returns the start of the timeframe.
     * - `getTimeAtPercent(1)` returns the end of the timeframe.
     * 
     * @param percent
     *  The percent amount of time into the timeframe.
     * @returns
     *  The time at the given percentage.
     */
    public getTimeAtPercent(percent: number): Date {
        return new Date(this.beg.getTime() + (this.getDuration() * percent));
    }

    /**
     * Returns true if the given timeframe overlaps this timeframe, false
     * otherwise.
     * @param timeframe
     *  The timeframe to compare.
     * @returns
     *  True if the timeframes overlap, false otherwise.
     */
    public isOverlapping(timeframe: Timeframe): boolean {
        return this.beg <= timeframe.end && timeframe.beg <= this.end;
    }

    /**
     * Returns true if the given time range overlaps this timeframe, false
     * otherwise.
     * @param beg
     *  The start of the time range.
     * @param end
     *  The end of the time range.
     * @returns
     *  True if the time range overlaps the timeframe, false otherwise.
     */
    public isTimeRangeOverlapping(beg: Date, end: Date): boolean {
        return this.beg <= end && beg <= this.end;
    }

    /**
     * Returns how far (as a percentage) the given date is into the timeframe.
     * @param date
     *  The date to evaluate. 
     * @returns
     *  How far (as a percentage) the date is into the timeframe.
     */
    public getPercentIn(date: Date): number {
        return this.getTimeFromStart(date) / this.getDuration();
    }

    /**
     * Returns the ratio of the given timeframe's duration over this
     * timeframe's duration.
     * @param timeframe
     *  The timeframe to evaluate.
     * @returns
     *  The given timeframe's duration over this timeframe's duration.
     */
    public getRatio(timeframe: Timeframe): number {
        return timeframe.getDuration() / this.getDuration();
    }

    /**
     * Returns the ratio of this timeframe's duration over the given
     * timeframe's duration.
     * @param timeframe
     *  The timeframe to evaluate.
     * @returns
     *  This timeframe's duration over the given timeframe's duration.
     */
    public getInverseRatio(timeframe: Timeframe): number {
        return this.getDuration() / timeframe.getDuration()
    }

    /**
     * Returns true if the given timeframe is equal in duration to this
     * timeframe, false otherwise.
     * @param timeframe
     *  The timeframe to evaluate.
     * @returns
     *  True if the timeframes are equal in duration, false otherwise.
     */
    public areEqualDuration(timeframe: Timeframe): boolean {
        return this.end.getTime() - this.beg.getTime() === 
            timeframe.end.getTime() - timeframe.beg.getTime();
    }

    /**
     * Copies the Timeframe.
     * @returns
     *  A copy of the Timeframe.
     */
    public copy(): Timeframe {
        return new Timeframe(this.beg, this.end);
    }

}
