import { generateBitMask } from "../Math";

export const Dimmed = {
    True     : 0b0000000000000000000000,
    False    : 0b0000000000000000000001
}
export const DimmedMask = generateBitMask(Dimmed);

export const LinkStyle = {
    Line       : 0b000000000000000000000,
    Arrow      : 0b000000000000000000010,
}
export const LinkStyleMask = generateBitMask(LinkStyle);

export const Shape = {
    Circle    : 0b0000000000000000000000,
    Triangle  : 0b0000000000000000000010,
    Square    : 0b0000000000000000000100,
    Rhombus   : 0b0000000000000000000110,
    Hexagon   : 0b0000000000000000001000,
}
export const ShapeMask = generateBitMask(Shape);

export const Size = {
    S         : 0b0000000000000000000000,
    M         : 0b0000000000000000010000,
    L         : 0b0000000000000000100000,
    XL        : 0b0000000000000000110000
}
export const SizeMask = generateBitMask(Size);

export const FillColor = {
    None      : 0b0000000000000000000000,
    Red       : 0b0000000000000001000000,
    Blue      : 0b0000000000000010000000,
    Orange    : 0b0000000000000011000000,
    Green     : 0b0000000000000100000000,
    Purple    : 0b0000000000000101000000,
    Gray      : 0b0000000000000110000000,
    DarkRed   : 0b0000000000000111000000,
    DarkGray  : 0b0000000000001000000000,
    DeepBlue  : 0b0000000000001001000000,
    DeepGreen : 0b0000000000001010000000,
}
export const FillColorMask = generateBitMask(FillColor);

export const Stroke1Color = {
    None      : FillColor.None << 4,
    Red       : FillColor.Red << 4,
    Blue      : FillColor.Blue << 4,
    Orange    : FillColor.Orange << 4,
    Green     : FillColor.Green << 4,
    Purple    : FillColor.Purple << 4,
    Gray      : FillColor.Gray << 4,
    DarkRed   : FillColor.DarkRed << 4,
    DarkGray  : FillColor.DarkGray << 4,
    DeepBlue  : FillColor.DeepBlue << 4,
    DeepGreen : FillColor.DeepGreen << 4
}
export const Stroke1ColorMask = generateBitMask(Stroke1Color);

export const Stroke2Color = {
    None      : FillColor.None << 8,
    Red       : FillColor.Red << 8,
    Blue      : FillColor.Blue << 8,
    Orange    : FillColor.Orange << 8,
    Green     : FillColor.Green << 8,
    Purple    : FillColor.Purple << 8,
    Gray      : FillColor.Gray << 8,
    DarkRed   : FillColor.DarkRed << 8,
    DarkGray  : FillColor.DarkGray << 8,
    DeepBlue  : FillColor.DeepBlue << 8,
    DeepGreen : FillColor.DeepGreen << 8
}
export const Stroke2ColorMask = generateBitMask(Stroke2Color);

export const Stroke1Width = {
    S         : 0b0000000000000000000000,
    M         : 0b0001000000000000000000,
    L         : 0b0010000000000000000000,
}
export const Stroke1WidthMask = generateBitMask(Stroke1Width);

export const Stroke2Width = {
    S         : Stroke1Width.S << 2,
    M         : Stroke1Width.M << 2,
    L         : Stroke1Width.L << 2,
}
export const Stroke2WidthMask = generateBitMask(Stroke2Width);
