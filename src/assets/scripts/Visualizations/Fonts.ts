export type FontDescriptor = {
    size: string,
    color?: string,
    family: string,
    weight?: number,
    lineHeight?: number
}

export class FontLoader {

    private static _can = document.createElement("canvas");
    private static _ctx = FontLoader._can.getContext("2d")! 

    /**
     * Loads the specified font.
     * @param font
     *  The font to load.
     * @param timeout
     *  The amount of time to wait (in milliseconds) before giving up.
     *  (Default: 4000)
     * @returns
     *  A Promise that resolves once the font has loaded.
     * @throws { Error }
     *  If the timeout was reached or if the document's font loader encountered
     *  an error while attempting to load the font.
     */
    public static async load(font: FontDescriptor, timeout: number = 4000): Promise<boolean> {
        let fontString = FontLoader.getCssFontString(font);
        let fonts = (document as any).fonts; 
        if(fonts.check(fontString)) {
            return true;
        } else {
            let start = Date.now();
            // Create loader
            let load = new Promise<boolean>(async (res, rej) => {
                (async function fetch() {
                    if(timeout <= Date.now() - start) {
                        rej(
                            new Error(`Failed to load font '${ 
                                fontString 
                            }' request timed out after ${ 
                                timeout 
                            }ms.`)
                        );
                    } else {
                        fonts.load(fontString).then((fontList: Array<any>) => {
                            if(0 < fontList.length) {
                                res(fonts.check(fontString));
                            } else {
                                setTimeout(fetch, 50);
                            }
                        }, rej);
                    }
                })()
            })
            // Create timer
            let timeoutId;
            let timer = new Promise<boolean>((_, rej) => {
                timeoutId = setTimeout(
                    () => rej(
                        new Error(`Failed to load font '${ 
                            fontString 
                        }' request timed out after ${ 
                            timeout 
                        }ms.`)
                    ),
                    timeout
                );
            })
            // Wait for either the loader or the timer to resolve
            let result = await Promise.race([load, timer]);
            // Clear timeout and complete request
            clearTimeout(timeoutId);
            return result;
        }
    }

    /**
     * Returns the width of the given text in the specified font.
     * 
     * NOTE: 
     * Ensure that the specified font has been loaded using load() first,
     * otherwise the text cannot be measured. 
     * 
     * @param text
     *  The text to measure.
     * @param font
     *  The text's font.
     * @returns
     *  The width of the text (in pixels).
     * @throws { TextMeasurementError }
     *  If `font` has not been loaded.
     */
    public static measureWidth(text: string, font: FontDescriptor): number {
        let f =  FontLoader.getCssFontString(font);
        if((document as any).fonts.check(f)) {
            FontLoader._ctx.font = f;
            return FontLoader._ctx.measureText(text).width;
        } else {
            throw new TextMeasurementError(`The font '${ 
                f 
            }' has not been loaded. The width of '${ 
                text 
            }' cannot be measured.`)
        }
    }

    /**
     * Converts a FontDescriptor into a CSS font string.
     * @param font
     *  The font to evaluate.
     * @returns
     *  The FontDescriptor as a CSS font string.
     */
    public static getCssFontString(font: FontDescriptor): string {
        return `${ font.weight ?? 400 } ${ font.size } ${ font.family }`
    }

}

export class TextMeasurementError extends Error {

    /**
     * Creates a new TextMeasurementError.
     * @param message
     *  The error message.
     */
    constructor(message: string) {
        super(`TextMeasurementError: ${ message }`);
    }

}
