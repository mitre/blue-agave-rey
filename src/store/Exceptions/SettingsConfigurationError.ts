import { DetailedError } from "@/assets/scripts/DetailedError";

export class SettingsConfigurationError extends DetailedError {

    /**
     * Creates a new SettingsConfigurationError.
     * @param error
     *  The error that occurred while loading the app's settings.
     */
    constructor(error: Error) {
        super("Invalid App Settings Configuration", error.message);
    }

}
