import { generateBitMask } from "../../Math";

export const Visibility = {
    Visible    : 0b000000,
    Hidden     : 0b000001,
}
export const VisibilityMask = generateBitMask(Visibility);

export const Select = {
    Unselected : 0b000000,
    Single     : 0b000010,
    Multi      : 0b000100
}
export const SelectMask = generateBitMask(Select);

export const Focus = {
    Focus      : 0b000000,
    NoFocus1   : 0b001000,
    NoFocus2   : 0b010000,
    NoFocusAll : 0b011000
}
export const FocusMask = generateBitMask(Focus);

export const IsCollapsed = {
    False      : 0b000000,
    True       : 0b100000
}
export const IsCollapsedMask = generateBitMask(IsCollapsed);
