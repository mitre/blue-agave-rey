const Uuid = /[\da-fA-F]{8}(?:-[\da-fA-F]{4}){3}-[\da-fA-F]{12}/;
const Path = /(?:\\\?\?\\|\\\\\?\\|\\\\\.\\){0,1}[a-zA-Z]:[\\\/](?:[^<>:"\/\\|?*\n]+[\\\/]?)*/

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
    return `${ text[0].toLocaleUpperCase() }${ text.substring(1) }`
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
 * Common Regex Patterns
 */
export const Regex = {
    Hex: /^[0-9a-fA-F]+$/,
    Path: new RegExp(`^${ Path.source }$`),
    Uuid: new RegExp(`^(?:{${ Uuid.source }}|${ Uuid.source })$`),
    Number: /^-?(?:\d*\.)?\d+$/,
    Command: new RegExp(`^"${ Path.source }".*$`)
}