import { DetailedError } from "@/assets/scripts/DetailedError";

export class NetworkReloadError extends DetailedError {

    /**
     * Creates a new NetworkReloadError.
     * @param error
     *  The error that prevented the network from being reloaded.
     */
    constructor(error: Error) {
        super("Unable to Load Force Directed Network", error.message);
    }

}
