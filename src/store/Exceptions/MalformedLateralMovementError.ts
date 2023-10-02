import { DetailedError } from "@/assets/scripts/DetailedError";

export class MalformedLateralMovementError extends DetailedError {

    /**
     * Creates a new MalformedLateralMovementError.
     * @param title
     *  The error's title.
     * @param message
     *  The error's message.
     * @param error
     *  Auxillary error data to include with the error. 
     *  (Default: {})
     */
    constructor(title: string, message: string, error: any = {}) {
        super(title, message, error);
    }

}
