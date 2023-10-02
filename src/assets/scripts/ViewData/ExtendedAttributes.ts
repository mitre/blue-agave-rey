import { generateBitMask } from "../Math";

export const HasAnalyticsHidden = {
    False        : 0b000000000000000,
    True         : 0b000000001000000
}
export const HasAnalyticsHiddenMask = generateBitMask(HasAnalyticsHidden);

export const ObjectType = {
    Unknown      : 0b000000000000000,
    Analytic     : 0b000000010000000,
    File         : 0b000000100000000,
    Flow         : 0b000000110000000,
    Process      : 0b000001000000000,
    Registry     : 0b000001010000000,
    PowerShell   : 0b000001100000000,
    Module       : 0b000001110000000
}
export const ObjectTypeMask = generateBitMask(ObjectType);

export const ActionType = {
    Unknown      : 0b000000000000000,
    Analytic     : 0b000100000000000,
    Create       : 0b001000000000000,
    Access       : 0b001100000000000,
    Load         : 0b010000000000000,
    Connect      : 0b010100000000000,
    Terminate    : 0b011000000000000
}
export const ActionTypeMask = generateBitMask(ActionType);

export const CarTypeMask = ObjectTypeMask | ActionTypeMask;

export const EdgeType = {
    Causal       : 0b000000010000000,
    NonCausal    : 0b000000100000000,
    Analytic     : 0b000000110000000
}
export const EdgeTypeMask = generateBitMask(EdgeType);

export const ObjectTypeString = {
    [ObjectType.Unknown]    : "unknown",
    [ObjectType.Analytic]   : "analytic",
    [ObjectType.File]       : "file",
    [ObjectType.Flow]       : "flow",
    [ObjectType.Process]    : "process",
    [ObjectType.Registry]   : "registry",
    [ObjectType.PowerShell] : "powershell",
    [ObjectType.Module]     : "module",
}

export const ActionTypeString = {
    [ActionType.Unknown]    : "unknown",
    [ActionType.Create]     : "create",
    [ActionType.Access]     : "access",
    [ActionType.Load]       : "load",
    [ActionType.Connect]    : "connect",
    [ActionType.Terminate]  : "terminate",
}
