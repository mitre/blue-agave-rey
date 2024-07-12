import type { ITimeframe } from "../Collections/Timeframe";

const Intervals = [
    1,          //   1 Millisecond
    5,          //   5 Milliseconds
    10,         //  10 Milliseconds
    50,         //  50 Milliseconds
    100,        // 100 Milliseconds
    500,        // 500 Milliseconds
    1000,       //   1 Second
    5000,       //   5 Seconds
    10000,      //  10 Seconds
    30000,      //  30 Seconds
    60000,      //   1 Minute
    300000,     //   5 Minutes
    600000,     //  10 Minutes
    900000,     //  15 Minutes
    1.8e+6,     //  30 Minutes
    3.6e+6,     //   1 Hour
    7.2e+6,     //   2 Hours
    1.08e+7,    //   3 Hours
    1.44e+7,    //   4 Hours
    2.16e+7,    //   6 Hours
    4.32e+7,    //  12 Hours
    8.64e+7,    //   1 Day
    6.048e+8,   //   1 Week
    2.628e+9,   // ~ 1 Month
    5.256e+9,   // ~ 2 Months
    7.884e+9,   // ~ 3 Months
    1.051e+10,  // ~ 4 Months
    1.577e+10,  // ~ 6 Months
    3.154e+10,  //   1 Year
];

const Months = [
    "Jan", "Feb", "Mar",
    "Apr", "May", "Jun",
    "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec"
];

const DefaultDurationAbbr = {
    day : "day",
    hr  : "hr",
    min : "min",
    sec : "sec"
}

const MIN_INTERVAL_WIDTH = 100;

/**
 * Calculates the best time interval to place the provided timeframe in.
 * 
 * **Example**
 * 
 * Given a `timeframe` defined between 1:38 PM and 2:42 PM, a `width` of
 * 1920px, and a `minIntervalWidth` of 100px, this function would fit the
 * timeframe between 1:35 PM and 2:45 PM with 14, 5-minute, segments dividing
 * the fitted timeframe.
 *  
 * @param timeframe
 *  The timeframe.
 * @param width
 *  The total width available in pixels.
 * @param minIntervalWidth
 *  The minimum segment width allowed (in pixels).
 *  (Default: 100)
 * @returns
 *  [beg]
 *   The fitted start time.
 *  [end]
 *   The fitted end time.
 *  [intervalDur]
 *   The fitted interval's duration in milliseconds.
 */
export function fitTimeframeInInterval(
    timeframe: ITimeframe, width: number,
    minIntervalWidth = MIN_INTERVAL_WIDTH
): FittedIntervalParameters {
    let fittedTimeframe: ITimeframe,
        intervalDur = 0,
        intervalWid = 0;
    for (let interval of Intervals) {
        fittedTimeframe = calculateTimeframeInInterval(timeframe, interval);
        intervalDur = interval;
        intervalWid = timeWidthFromDuration(fittedTimeframe, width, interval);
        if (minIntervalWidth <= intervalWid) break;
    }
    return { ...fittedTimeframe!, intervalDur };
}

/**
 * Given a timeframe and an interval length (in milliseconds), this function
 * fits the timeframe between a start and end time that is evenly divisible by
 * the interval.
 * 
 * **Example**
 * 
 * With a timeframe defined between 1:38 PM and 2:42 PM and an interval of 10
 * minutes (600000ms), this function would return a fitted start time of 1:30 PM
 * and a fitted end time of 2:50 PM with 8, 10-minute, segments dividing them.
 *   
 * @param timeframe
 *  The timeframe to fit.
 * @param interval
 *  The interval (in milliseconds).
 * @returns
 *  [beg]
 *   The fitted start time.
 *  [end]
 *   The fitted end time.
 */
function calculateTimeframeInInterval(
    timeframe: ITimeframe, interval: number
): ITimeframe {
    let beg = Math.floor(timeframe.beg.getTime() / interval)
    let end = Math.ceil(timeframe.end.getTime() / interval)
    return {
        beg: new Date(beg * interval),
        end: new Date(end * interval)
    }
}

/**
 * Calculates the best time interval to place inside the provided timeframe.
 * 
 * **Example**
 * 
 * Given a `timeframe` defined between 1:38 PM and 2:42 PM, a `width` of
 * 1920px, and a `minIntervalWidth` of 100px, this function would fit an
 * interval region between 1:40 PM and 2:40 PM with 12, 5-minute, segments
 * dividing the fitted region.
 * 
 * @param timeframe
 *  The timeframe.
 * @param width
 *  The total width of the timeframe in pixels.
 * @param minIntervalWidth
 *  The minimum segment width allowed (in pixels).
 *  (Default: 100)
 * @returns
 *  The fitted interval's duration in milliseconds.
 */
export function fitIntervalInTimeframe(
    timeframe: ITimeframe, width: number,
    minIntervalWidth = MIN_INTERVAL_WIDTH
): number {
    let fittedRegion: ITimeframe,
        intervalDur = 0,
        intervalWid = 0,
        regionWidth = 0,
        begOffset = 0,
        endOffset = 0;
    for (let interval of Intervals) {
        fittedRegion = calculateIntervalInTimeframe(timeframe, interval);
        begOffset = fittedRegion.beg.getTime() - timeframe.beg.getTime();
        endOffset = timeframe.end.getTime() - fittedRegion.end.getTime();
        regionWidth = width - timeWidthFromDuration(timeframe, width, begOffset + endOffset);
        intervalDur = interval;
        intervalWid = timeWidthFromDuration(fittedRegion, regionWidth, interval);
        if (intervalWid >= minIntervalWidth) break;
    }
    return intervalDur;
}

/**
 * Given a timeframe and an interval length (in milliseconds), this function
 * fits a start and end time inside the timeframe which is evenly
 * divisible by the interval.
 * 
 * **Example**
 * 
 * With a timeframe defined between 1:38 PM and 2:42 PM and an interval of 10
 * minutes (600000ms), this function would fit an interval region between
 * 1:40 PM and 2:40 PM with 6, 10-minute, segments dividing it.
 *   
 * @param timeframe
 *  The timeframe to fit.
 * @param interval
 *  The interval (in milliseconds).
 * @returns
 *  [beg]
 *   The fitted interval region's start time.
 *  [end]
 *   The fitted interval region's end time.
 */
function calculateIntervalInTimeframe(
    timeframe: ITimeframe, interval: number
): ITimeframe {
    let beg = Math.ceil(timeframe.beg.getTime() / interval);
    let end = Math.floor(timeframe.end.getTime() / interval);
    return {
        beg: new Date(beg * interval),
        end: new Date(end * interval)
    }
}

/**
 * Formats the date portion of a Date object as a string.
 * @param date
 *  The date to format.
 * @returns
 *  The date portion of the Date object in the format M/D/Y.
 *  Where "M" is the month's numeric.
 */
export function formatDate(date: Date): string {
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
}

/**
 * Formats the date portion of a Date object as a string.
 * @param date
 *  The date to format.
 * @returns
 *  The date portion of the Date object in the format M D, Y.
 *  Where "M" is the month's 3-letter name.
 */
export function formatDateCal(date: Date): string {
    let month = date.getMonth();
    let day = date.getDate();
    let year = date.getFullYear().toString().slice(-2);
    return `${Months[month]} ${day}, ${year}`;
}

/**
 * Formats the time portion of a Date object as a 12-hour time string.
 * @param date
 *  The date to format.
 * @param level
 *  The level of clarity.
 *  [0]
 *   HH:MM TT
 *  [1]
 *   HH:MM:SS TT
 *  [2]
 *   HH:MM:SS.S TT
 * @returns
 *  The time portion of the Date object as a string. 
 */
export function format12HourTime(date: Date, level: number): string {
    let meridiem = date.getHours() < 12 ? "AM" : "PM"
    let hour     = date.getHours() % 12;
    let mins     = `${date.getMinutes()}`.padStart(2, "0");
    let secs     = `${date.getSeconds()}`.padStart(2, "0");
    let milli    = `${date.getMilliseconds()}`.padStart(3, "0");
    if (hour === 0) hour = 12;
    switch (level) {
        default:
        case 2: return `${hour}:${mins}:${secs}.${milli} ${meridiem}`;
        case 1: return `${hour}:${mins}:${secs} ${meridiem}`;
        case 0: return `${hour}:${mins} ${meridiem}`;
    }
}

/**
 * Formats the time portion of a Date object as a 24-hour time string.
 * @param date
 *  The date to format.
 * @param level
 *  The level of clarity.
 *  [0]
 *   HH:MM
 *  [1]
 *   HH:MM:SS
 *  [2]
 *   HH:MM:SS.S
 * @returns
 *  The time portion of the Date object as a string. 
 */
export function format24HourTime(date: Date, level: number): string {
    let hour  = `${date.getHours()}`.padStart(2, "0");
    let mins  = `${date.getMinutes()}`.padStart(2, "0");
    let secs  = `${date.getSeconds()}`.padStart(2, "0");
    let milli = `${date.getMilliseconds()}`.padStart(3, "0");
    switch (level) {
        default:
        case 2: return `${hour}:${mins}:${secs}.${milli}`;
        case 1: return `${hour}:${mins}:${secs}`;
        case 0: return `${hour}:${mins}`;
    }
}

/**
 * Segments the time portion of a Date object into an object which contains
 * the date's current hour, minute, second, and millisecond.
 * @param time
 *  The date to evaluate.
 * @param in24HourTime
 *  [true]
 *   The date will be formatted in 24 hour time.
 *  [false]
 *   The date will be formatted in 12 hour time.
 * @returns
 *  The time portion of the date segmented into an object.
 *  [hour]
 *   The time's current hour.
 *  [min]
 *   The time's current minute.
 *  [sec]
 *   The time's current second.
 *  [ms]
 *   The time's current millisecond.
 *  [meridiem]
 *   The time's current meridiem. (If formatted using 12-hour time.)
 */
export function formatTime(time: Date, in24HourTime: true): Time24Hour;
export function formatTime(time: Date, in24HourTime: false): Time12Hour;
export function formatTime(time: Date, in24HourTime: boolean): Time24Hour | Time12Hour;
export function formatTime(time: Date, in24HourTime: boolean): Time24Hour | Time12Hour {
    let min = `${time.getMinutes()}`.padStart(2, "0");
    let sec = `${time.getSeconds()}`.padStart(2, "0");
    let ms  = `${time.getMilliseconds()}`.padStart(3, "0");
    if (in24HourTime) {
        let hour = time.getHours();
        return { hour: `${hour}`, min, sec, ms }
    } else {
        let meridiem = time.getHours() < 12 ? "AM" : "PM"
        let hour = time.getHours() % 12;
        if (hour === 0) hour = 12;
        return { hour: `${hour}`, min, sec, ms, meridiem }
    }
}

/**
 * Returns the duration of time between the given start and end time.
 * 
 * **Example**
 * 
 * The time between the dates:
 * 01/22/2022 10:32:42 AM and 
 * 01/24/2022 02:10:25 AM is
 * 1 day, 15 hours, 37 minutes, and 43 seconds.
 * 
 * @param beg
 *  The start time in milliseconds.
 * @param end
 *  The end time in milliseconds.
 * @returns
 *  An object containing the time between the two dates.
 */
export function getDuration(beg: number, end: number): TimeDuration {
    let duration = Math.abs(end - beg);
    let units = { days: 0, hours: 0, mins: 0, secs: 0 }
    units.days = Math.floor(duration / Time.Day);
    duration -= (units.days * Time.Day);
    units.hours = Math.floor(duration / Time.Hour);
    duration -= (units.hours * Time.Hour);
    units.mins = Math.floor(duration / Time.Minute);
    duration -= (units.mins * Time.Minute);
    units.secs = Math.floor(duration / Time.Second);
    duration -= (units.secs * Time.Second);
    return units
}

/**
 * Formats the duration between a start and end time as a string.
 * @param beg
 *  The start time in milliseconds.
 * @param end
 *  The end time in milliseconds.
 * @param abbr
 *  The abbreviations to use for days, hours, minutes, and seconds.
 *  (Default: `DefaultDurationAbbr`) 
 * @returns
 *  The formatted duration.
 */
export function formatDuration(beg: number, end: number, abbr = DefaultDurationAbbr): string {
    let d = getDuration(beg, end);
    let text = "";
    if (0 < d.days) {
        text += `, ${d.days} ${ abbr.day }`;
    }
    if (0 < d.hours) {
        text += `, ${d.hours} ${ abbr.hr }`;
    }
    if (0 < d.mins) {
        text += `, ${d.mins} ${ abbr.min }`;
    }
    if (0 < d.secs || !text) {
        text += `, ${d.secs} ${ abbr.sec }`;
    }
    return text.substring(2);
}

/**
 * Calculates the duration (in milliseconds) a region of pixels represents.
 * @param timeframe
 *  The timeframe.
 * @param pxWidth
 *  The width of the timeframe in pixels.    
 * @param pxDelta
 *  The width of the query region in pixels.
 * @returns
 *  The duration (in milliseconds) the region of pixels represents.
 */
export function timeDurationFromWidth(
    timeframe: ITimeframe, pxWidth: number, pxDelta: number
): number {
    return (pxDelta / pxWidth) * (timeframe.end.getTime() - timeframe.beg.getTime());
}

/**
 * Calculates the width (in pixels) a region of time represents.
 * @param timeframe
 *  The timeframe.
 * @param pxWidth
 *  The width of the timeframe in pixels.
 * @param durDelta
 *  The duration of the query region in milliseconds.
 * @returns
 *  The width (in pixels) the region of time represents. 
 */
export function timeWidthFromDuration(
    timeframe: ITimeframe, pxWidth: number, durDelta: number
): number {
    return durDelta / (timeframe.end.getTime() - timeframe.beg.getTime()) * pxWidth;
}

/**
 * Calculates the time at the given pixel location.
 * @param timeframe
 *  The timeframe. 
 * @param width
 *  The width of the timeframe in pixels.
 * @param location
 *  The pixel location, relative to the width of the timeframe. (Given a
 *  `width` of 100px, the location 0px returns the start of the timeframe, the
 *  location 100px returns the end of the timeframe.)
 * @returns
 *  The time at the given pixel location.
 */
export function calculateTimeAtPixel(
    timeframe: ITimeframe, width: number, location: number
): Date {
    let duration = (location / width) * (timeframe.end.getTime() - timeframe.beg.getTime());
    return new Date(timeframe.beg.getTime() + duration);
}

/**
 * Calculates the pixel location at the given time.
 * @param timeframe
 *  The timeframe.
 * @param width
 *  The width of the timeframe in pixels.
 * @param time
 *  The time to query.
 * @returns
 *  The pixel location at the given time.
 */
export function calculatePixelAtTime(
    timeframe: ITimeframe, width: number, time: Date
): number {
    return ((time.getTime() - timeframe.beg.getTime()) /
        (timeframe.end.getTime() - timeframe.beg.getTime())) * width;
}


/**
 * Calculates the pixel location at the given time.
 * @param timeframe
 *  The timeframe.
 * @param width
 *  The width of the timeframe in pixels.
 * @param time
 *  The time to query in milliseconds.
 * @returns
 *  The pixel location at the given time.
 */
export function calculatePixelAtMs(
    timeframe: ITimeframe, width: number, time: number
): number {
    return ((time - timeframe.beg.getTime()) /
        (timeframe.end.getTime() - timeframe.beg.getTime())) * width;
}

export const Time = {
    Day: 8.64e+7,
    Hour: 3.6e+6,
    Minute: 60000,
    Second: 1000
}

export type FittedIntervalParameters = {
    beg: Date
    end: Date
    intervalDur: number
}

export type TimeDuration = {
    days: number
    hours: number
    mins: number
    secs: number
}

export type Time12Hour = {
    hour: string
    min: string
    sec: string
    ms: string
    meridiem: string
}

export type Time24Hour = {
    hour: string
    min: string
    sec: string
    ms: string
}
