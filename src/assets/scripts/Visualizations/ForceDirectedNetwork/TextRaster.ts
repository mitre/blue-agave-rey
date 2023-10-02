import { FontDescriptor, FontLoader } from "../Fonts";

export class TextRaster {

    public canvas: HTMLCanvasElement
    public width: number
    public height: number

    private _context: CanvasRenderingContext2D;
    private _actions: ContextAction[];
    private _padding: number;

    /**
     * Creates a new TextRaster.
     * @param text
     *  The text.
     * @param fonts
     *  The font styles referenced in the text.
     * @param padding
     *  The text's padding.
     * @param k
     *  The raster's scale.
     *  (Default: 1)
     * @throws { MissingFontStyleError }
     *  If `text` references a font style not defined in `fonts`.
     */
    constructor(text: string, fonts: Map<string, FontDescriptor>, padding: number, k: number = 1) {
        // Configure state
        this.canvas = document.createElement("canvas");
        this._context = this.canvas.getContext("2d")!;
        this._padding = padding;
        // Compute draw instructions
        let { width, height, instructions } = this.deriveDrawInstructions(text, fonts);
        this.width = Math.ceil(width) + (this._padding << 1);
        this.height = Math.ceil(height) + (this._padding << 1);
        this._actions = instructions;
        // Render image
        this.scale(k);
    }

    /**
     * Parses a stylized text string into a series of context actions.
     * @param text
     *  The stylized text.
     * @param fonts
     *  The font styles referenced in the text.
     * @returns
     *  [width]
     *   The required width of the canvas.
     *  [height]
     *   The required height of the canvas.
     *  [instructions]
     *   The set of actions needed to draw the stylized text to the context.
     * @throws { MissingFontStyleError }
     *  If `text` references a font style not defined in `fonts`.
     */
    private deriveDrawInstructions(
        text: string, fonts: Map<string, FontDescriptor>
    ): ContextInstructions {
        let lines = text.split("\n");
        let width = 0;
        let height = 0;
        let lineOffset = 0;
        let lineHeight = 0;
        let instructions: ContextAction[][] = new Array(lines.length);
        for(let i = 0; i < lines.length; i++) {
            let tWidth = 0;
            let maxAscent = 0;
            let maxDecent = 0;
            let maxLineHeight = 0;
            let actions: ContextAction[] = [];
            let tokens: string[] = lines[i].split(/(<[^*<>]+>)/).filter(Boolean);
            // Parse line
            for(let token of tokens) {
                let action: ContextAction;
                if(/<([^*<>]+)>/.test(token)) {
                    // Create style action
                    let id = token.replace(/<([^*<>]+)>/g, (_, v) => `${v}`);
                    if(!fonts.has(id)) {
                        throw new MissingFontStyleError(
                            `Cannot format text '${text}' missing font style '${id}'.`
                        );
                    }
                    let font = fonts.get(id)!;
                    action = {
                        type: "style",
                        font: FontLoader.getCssFontString(font),
                        color: font.color ?? "#000",
                        lineHeight: font.lineHeight ?? 0
                    };
                    // Style canvas
                    this._context.font = action.font;
                    lineHeight = action.lineHeight;
                } else {
                    // Create draw action
                    action = {
                        type: "draw",
                        text: token.replace(/<\*([^<>]+)>/g, (_, v) => `<${v}>`),
                        x: 0,
                        y: 0
                    }
                    // Compute draw position
                    let box = this._context.measureText(action.text);
                    maxAscent = Math.max(maxAscent, box.actualBoundingBoxAscent);
                    maxDecent = Math.max(maxDecent, box.actualBoundingBoxDescent);
                    maxLineHeight = Math.max(maxLineHeight, lineHeight);
                    action.x = tWidth;
                    tWidth += box.width;
                }
                actions.push(action);
            }
            // Assign line offset
            lineOffset += i === 0 ? maxAscent : maxLineHeight;
            for(let action of actions) {
                if(action.type === "style") continue;
                action.y = lineOffset;
            }
            // Compute max width and height
            width  = Math.max(width, tWidth);
            height = Math.max(height, lineOffset + maxDecent);
            instructions[i] = actions;
        }
        return { width, height, instructions: instructions.flat() };
    }

    /**
     * Redraws the raster at the given scale.
     * @param k
     *  The new scale of the raster.
     */
    public scale(k: number) {
        // Resize canvas
        this.canvas.width = this.width * k;
        this.canvas.height = this.height * k;
        // Scale context
        this._context.setTransform(k, 0, 0, k, 0, 0);
        // Draw text
        for(let action of this._actions) {
            switch(action.type) {
                case "style":
                    this._context.font = action.font;
                    this._context.fillStyle = action.color;
                    break;
                case "draw":
                    this._context.fillText(
                        action.text,
                        this._padding + action.x, 
                        this._padding + action.y
                    );
                    break;
            }
        }
    };

}

export class MissingFontStyleError extends Error {

    /**
     * Creates a new MissingFontStyleError.
     * @param message
     *  The error message.
     */
    constructor(message: string) {
        super(`MissingFontStyleError: ${ message }`);
    }

}


///////////////////////////////////////////////////////////////////////////////
//  Internal Types  ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


type ContextInstructions = 
    { width: number, height: number, instructions: ContextAction[] }
type ContextAction = 
    { type: "style", font: string, color: string, lineHeight: number } | 
    { type: "draw", text: string, x: number, y: number }
