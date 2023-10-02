export class DetailedError extends Error {

    public title: string;
    public etc: any;

    /**
     * Creates a new DetailedError.
     * @param title
     *  The error's title.
     * @param message
     *  The error's message.
     * @param error
     *  Auxillary error data to include with the error. 
     *  (Default: {})
     */
    constructor(title: string, message: string, error?: any) {
        super(message);
        this.title = title;
        this.etc = { error };
    }

}
