export class Download {

    private static _aLink = document.createElement("a");

    /**
     * Downloads a text file.
     * @param filename
     *  The text file's name.
     * @param text
     *  The text file's contents.
     * @param ext
     *  The text file's extension.
     *  (Default: 'txt')
     */
    public static textFile(filename: string, text: string, ext = "txt") {
        let blob = new Blob([text], { type: "octet/stream" });
        let url = window.URL.createObjectURL(blob);
        this._aLink.href = url;
        this._aLink.download = `${ filename }.${ ext }`;
        this._aLink.click();
        window.URL.revokeObjectURL(url);
    }

}
