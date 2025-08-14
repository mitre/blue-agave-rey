import type { MatchData } from "lunr";

const Uuid = /[\da-fA-F]{8}(?:-[\da-fA-F]{4}){3}-[\da-fA-F]{12}/;
const Path = /(?:\\\?\?\\|\\\\\?\\|\\\\\.\\){0,1}[a-zA-Z]:[\\\/](?:[^<>:"\/\\|?*\n]+[\\\/]?)*/

/**
 * Common Regex Patterns
 */
export const Regex = {
    Hex: /^[0-9a-fA-F]+$/,
    Path: new RegExp(`^${ Path.source }$`),
    Uuid: new RegExp(`^(?:{${ Uuid.source }}|${ Uuid.source })$`),
    Number: /^-?(?:\d*\.)?\d+$/,
    Command: new RegExp(`^"${ Path.source }".*$`)
}

/**
 * Computes the hash of a string using Java's `hashCode()` function.
 * @param string
 *  The string to hash.
 * @returns
 *  The string's hash.
 */
export function computeHash(string: string): number {
    let hash = 0;
    if (string.length === 0)
        return hash;
    for (let i = 0; i < string.length; i++) {
        hash = ((hash << 5) - hash) + string.charCodeAt(i);
        hash |= 0; // Convert to 32-bit integer
    }
    return hash;
}

/**
 * Capitalizes the first letter in a string.
 * 
 * **Example**

 * - `"foo_bar"` -> `"Foo_bar"`
 * - `"hello world"` -> `"Hello world"` 
 * 
 * @param text
 *  The string to capitalize.
 * @returns
 *  The capitalized string.
 */
export function capitalize(text: string): string {
    if(text) {
        return `${ text[0].toLocaleUpperCase() }${ text.substring(1) }`
    } else {
        return text;
    }
}

/**
 * Formats a string in title case.
 * 
 * **Example**
 * 
 * - `"foo_bar"` -> `"Foo Bar"`
 * - `"hello world"` -> `"Hello World"` 
 * 
 * @param text
 *  The string to format.
 * @returns
 *  The string formatted in title case.
 */
export function titleCase(text: string): string {
    return text.split(/\s+|_/).map(s => capitalize(s)).join(" ");
}

/**
 * Segments a document's fields using a Lunr match result. 
 * @param doc
 *  The Lunr document.
 * @param match
 *  The Lunr match result.
 * @param abbreviate
 *  The number of characters to include on either side of a text match. -1 to
 *  apply no abbreviation.
 * @returns
 *  A map containing the segmented fields.
 */
export function segmentFields(doc: any, match: MatchData, abbreviate: number = -1): Map<string, Segment[]> {
    // Compile positions
    const positions = new Map<string, number[][]>();
    let fields: any, term, field, position;
    for(term in match.metadata) {
        fields = (match.metadata as any)[term];
        for(field in fields) {
            position = fields[field].position;
            if(positions.has(field)) {
                position = positions.get(field)!.concat(position)
            }
            positions.set(field, position);
        }
    }
    // Compile segments
    let str;
    const segments = new Map<string, Segment[]>();
    for(const [field, position] of positions) {
        // Sort positions
        position.sort((a,b) => a[0] - b[0]);
        // Segment
        str = doc[field]?.toString() ?? "";
        segments.set(field, segmentText(str, position, abbreviate));
    }
    return new Map(
        [...segments].sort((a, b) => a[0].localeCompare(b[0]))
    );
}

/**
 * Segments text based using a series of positions.
 * @param str
 *  The text to segment.
 * @param positions
 *  The positions to segment.
 * @param abbreviate
 *  The number of characters to include on either side of the segmentations. -1
 *  to apply no abbreviation.
 */
function segmentText(str: string, pos: number[][], abbreviate: number = -1): Segment[] {
    if(!pos.length) {
        return [{ text: str, type: "text" }];
    }
    const segments = new Array<Segment>();
    let s, e, sh, text, thisPosition, nextPosition;
    if(abbreviate === -1) {
        s = 0;
        e = pos[0][0];
        text = str.slice(s, e);
        if(text) {
            segments.push({ text, type: "text" });
        }
        for(let i = 0; i < pos.length; i++) {
            thisPosition = pos[i];
            nextPosition = pos[i + 1];
            s = thisPosition[0];
            e = s + thisPosition[1];
            segments.push({ 
                text: str.slice(s, e),
                type: "mark"
            });
            s = e;
            e = nextPosition ? nextPosition[0] : str.length;
            if(0 < e - s) {
                segments.push({
                    text: str.slice(s, e),
                    type: "text"
                });
            }
        }
    } else {
        s = Math.max(0, pos[0][0] - abbreviate);
        e = pos[0][0];
        text = str.slice(s, e);
        if(text) {
            segments.push({
                text: (s ? "…" : "") + text,
                type: "text"
            });
        }
        for(let i = 0; i < pos.length; i++) {
            thisPosition = pos[i];
            nextPosition = pos[i + 1];
            s = thisPosition[0];
            e = s + thisPosition[1];
            segments.push({
                text: str.slice(s, e),
                type: "mark"
            });
            s = e;
            e = nextPosition ? nextPosition[0] : str.length;
            sh = i === pos.length - 1 ? 0 : 1;
            if((abbreviate << sh) < e - s) {
                text = str.slice(s, s + abbreviate) + "…";
                if(i !== pos.length - 1) {
                    s = e - abbreviate;
                    text += " …" + str.slice(s, e);
                }
                segments.push({ text, type: "text" });
            } else if(0 < e - s) {
                segments.push({
                    text: str.slice(s, e),
                    type: "text"
                });
            }
        }
    }
    return segments;
}

/**
 * A text segment
 */
export interface Segment {
    text: string,
    type: "text" | "mark"
}
