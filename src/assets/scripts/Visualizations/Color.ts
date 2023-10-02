/**
 * Converts hex to hsv/hsb.
 * @param hex
 *  The hex color value.
 * @returns
 *  The converted hsv/hsb values
 */
export function hexToHsv(hex: string): number[] {

    // Convert hex to rgb
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[3], 16);
        b = parseInt(hex[3] + hex[4], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
    }

    // Normalize channel values
    r /= 255;
    g /= 255;
    b /= 255;

    let channelMin = Math.min(r, g, b)
    let channelMax = Math.max(r, g, b)
    let channelDelta = channelMax - channelMin
    let h = 0
    let s = 0
    let v = 0

    // Calculate hue
    if (channelDelta === 0)
        h = 0;
    else if (channelMax === r)
        h = ((g - b) / channelDelta) % 6;
    else if (channelMax === g)
        h = (b - r) / channelDelta + 2;
    else
        h = (r - g) / channelDelta + 4;
    h = Math.round(h * 60);
    if (h < 0)
        h += 360;

    // Calculate lightness and value
    v = channelMax;
    s = channelDelta === 0 ? 0 : channelDelta / v;

    // Scale values by 100 and round to the nearest tenth
    s = Math.round(s * 1000) / 10;
    v = Math.round(v * 1000) / 10;

    return [h, s, v];

}

/**
 * Converts hsv/hsb to hex.
 * @param h
 *  The hue value.
 * @param s 
 *  The saturation value.
 * @param v
 *  The value/brightness value.
 * @returns
 *  The converted hex value.
 */
export function hsvToHex(h: number, s: number, v: number): string {
    
    // Scale values down by 100
    s /= 100;
    v /= 100;

    // Compute rgb values
    let c = v * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)

    // Convert rgb to hex
    return `#${ (r << 16 | g << 8 | b).toString(16).padStart(6, "0") }`;

}
