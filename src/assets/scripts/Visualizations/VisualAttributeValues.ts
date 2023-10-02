import { Colors } from "./Colors"
import { GraphNode } from "./ForceDirectedNetwork/GraphNode"
import {
    Size, 
    Dimmed,
    FillColor, 
    LinkStyle,
    Stroke1Color,
    Stroke1Width,
    Stroke2Width 
} from "./VisualAttributes"

// TODO: Algorithmically populate maps and remove '>>> 4' (e.g. when converting
//       Stroke2Color to Stroke1Color for ColorMap) in reliant files.

export const OpacityMap = {
    [Dimmed.False] : 1,
    [Dimmed.True]  : 0.05
}

export const SizeMap = {
    [Size.XL] : 30,
    [Size.L]  : 20,
    [Size.M]  : 15,
    [Size.S]  : 10,
}

export const ColorMap = {
    [FillColor.None]         : Colors.WHITE,
    [FillColor.Red]          : Colors.RED,
    [FillColor.Blue]         : Colors.BLUE,
    [FillColor.Orange]       : Colors.ORANGE,
    [FillColor.Green]        : Colors.GREEN,
    [FillColor.Purple]       : Colors.PURPLE,
    [FillColor.Gray]         : Colors.GRAY,
    [FillColor.DarkGray]     : Colors.DARK_GRAY,
    [FillColor.DeepBlue]     : Colors.DEEP_BLUE,
    [FillColor.DeepGreen]    : Colors.DEEP_GREEN,
    [FillColor.DarkRed]      : Colors.WHITE,  // No dark red yet :(
    [Stroke1Color.None]      : Colors.WHITE,
    [Stroke1Color.Red]       : Colors.LIGHT_RED,
    [Stroke1Color.Blue]      : Colors.LIGHT_BLUE,
    [Stroke1Color.Orange]    : Colors.LIGHT_ORANGE,
    [Stroke1Color.Green]     : Colors.LIGHT_GREEN,
    [Stroke1Color.Purple]    : Colors.LIGHT_PURPLE,
    [Stroke1Color.Gray]      : Colors.DARK_GRAY,
    [Stroke1Color.DarkRed]   : Colors.RED,
    [Stroke1Color.DarkGray]  : Colors.DARK_DARK_GRAY,
    [Stroke1Color.DeepBlue]  : Colors.DEEP_BLUE,
    [Stroke1Color.DeepGreen] : Colors.DEEP_GREEN
}

export const StrokeSizeMap = {
    [Stroke1Width.L] : 3,
    [Stroke1Width.M] : 2,
    [Stroke1Width.S] : 1,
    [Stroke2Width.L] : 3,
    [Stroke2Width.M] : 2,
    [Stroke2Width.S] : 1
}

export const LinkColorMap = {
    [FillColor.None]         : Colors.WHITE,
    [FillColor.Red]          : Colors.LIGHT_RED,
    [FillColor.Blue]         : Colors.LIGHT_BLUE,
    [FillColor.Orange]       : Colors.LIGHT_ORANGE,
    [FillColor.Green]        : Colors.LIGHT_GREEN,
    [FillColor.Purple]       : Colors.LIGHT_PURPLE,
    [FillColor.Gray]         : Colors.GRAY,
    [FillColor.DarkRed]      : Colors.RED,
    [FillColor.DarkGray]     : Colors.DARK_DARK_GRAY,
    [FillColor.DeepBlue]     : Colors.DEEP_BLUE,
    [FillColor.DeepGreen]    : Colors.DEEP_GREEN,
    [Stroke1Color.None]      : Colors.WHITE,
    [Stroke1Color.Red]       : Colors.LIGHT_RED,
    [Stroke1Color.Blue]      : Colors.LIGHT_BLUE,
    [Stroke1Color.Orange]    : Colors.LIGHT_ORANGE,
    [Stroke1Color.Green]     : Colors.LIGHT_GREEN,
    [Stroke1Color.Purple]    : Colors.LIGHT_PURPLE,
    [Stroke1Color.Gray]      : Colors.GRAY,
    [Stroke1Color.DarkRed]   : Colors.RED,
    [Stroke1Color.DarkGray]  : Colors.DARK_DARK_GRAY,
    [Stroke1Color.DeepBlue]  : Colors.DEEP_BLUE,
    [Stroke1Color.DeepGreen] : Colors.DEEP_GREEN,
}

export const LinkStyleMap = {
    [LinkStyle.Arrow] : drawArrowLine,
    [LinkStyle.Line]  : drawLine
}

/**
 * Draws an arrow between two nodes.
 * @param context
 *  The context to draw on.
 * @param source
 *  The source node.
 * @param target
 *  The target node.
 */
function drawArrowLine(context: CanvasRenderingContext2D, source: GraphNode, target: GraphNode) {
    let height = 12;
    let dx = target.x! - source.x!;
    let dy = target.y! - source.y!;
    let len = Math.sqrt(dx ** 2 + dy ** 2);
    let angle = Math.atan2(dy, dx);
    let toX = (target.x! - ((target.radius + 1) * dx / len));
    let toY = (target.y! - ((target.radius + 1) * dy / len));
    let a = toX - height * Math.cos(angle - Math.PI / 6);
    let b = toY - height * Math.sin(angle - Math.PI / 6);
    let c = toX - height * Math.cos(angle + Math.PI / 6);
    let d = toY - height * Math.sin(angle + Math.PI / 6);
    context.moveTo(source.x!, source.y!);
    context.lineTo(toX, toY);
    context.lineTo(a, b);
    context.lineTo(c, d);
    context.lineTo(toX, toY);
}

/**
 * Draws a line between two nodes.
 * @param context
 *  The context to draw on.
 * @param source
 *  The source node.
 * @param target
 *  The target node.
 */
function drawLine(context: CanvasRenderingContext2D, source: GraphNode, target: GraphNode) {
    context.moveTo(source.x!, source.y!);
    context.lineTo(target.x!, target.y!);
}
