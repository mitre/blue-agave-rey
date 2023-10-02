import { DetailedError } from "@/assets/scripts/DetailedError";

export class TimelineReloadError extends DetailedError {

    /**
     * Creates a new TimelineReloadError.
     * @param error
     *  The error that prevented the timeline from being reloaded.
     */
    constructor(error: Error) {
        super("Unable to Load Timeline", error.message);
    }

}
