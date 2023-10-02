/**
 * Generates a hatch canvas pattern.
 * @param width
 *  The width of the hatch line.
 * @param gap
 *  The width of the gap between lines.
 * @param fillColor
 *  The background color.
 * @param strokeColor
 *  The line color.
 * @returns
 *  The hatch canvas pattern.
 */
export function createHatchPattern(
    width: number, gap: number, 
    fillColor: string, strokeColor: string
): CanvasPattern {
    let dim = (width * 4) + (gap * 2);
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d", { alpha: false })!;
    canvas.width = dim;
    canvas.height = dim;
    context.fillStyle = fillColor;
    context.strokeStyle = strokeColor;
    context.lineWidth = width * 2;
    context.fillRect(0,0,dim,dim);
    context.moveTo(0, dim);
    context.lineTo(dim, 0);
    context.moveTo(dim - width, dim + width);
    context.lineTo(dim + width, dim - width);
    context.moveTo(-width, +width);
    context.lineTo(+width, -width);
    context.stroke();
    return context.createPattern(canvas, "repeat")!;
}
