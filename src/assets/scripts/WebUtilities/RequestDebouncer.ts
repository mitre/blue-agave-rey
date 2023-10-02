export class RequestDebouncer<T> {

    private _callId: number;
    private _reject: ((error: Error) => void) | null;
    private _resolve: (result: T) => void;

    /**
     * Creates a new RequestDebouncer.
     */
    constructor() {
        this._callId = 0;
        this._reject = null;
        this._resolve = () => {};
    }

    /**
     * Submits a Promise to the debouncer.
     * @param promise
     *  The promise to submit.
     */
    public submit(promise: Promise<T>) {
        let id = ++this._callId;
        promise
        .then(result => {
            if(this._callId !== id)
                return;
            this._resolve(result);
        })
        .catch(error => { 
            if(this._callId !== id)
                return;
            if(this._reject) {
                this._reject(error);
            } else {
                throw error;
            }
        });
    }

    /**
     * Sets the debouncer's result handler.
     * @param callback
     *  The function to call once the most recent request resolves.
     * @returns
     *  The RequestDebouncer.
     */
    public onResult(callback: (result: T) => void): RequestDebouncer<T> {
        this._resolve = callback;
        return this;
    }

    /**
     * Sets the debouncer's error handler.
     * @param callback
     *  The function to call once the most recent request rejects.
     * @returns
     *  The RequestDebouncer.
     */
    public onError(callback: (error: Error) => void): RequestDebouncer<T> {
        this._reject = callback;
        return this;
    }

}
