/**
 * Token Info
 */
export enum TokenInfo {
    
    None         = 0b00000,

    /**
     * Token Attributes
     */

    Error        = 0b10000,
    Warning      = 0b01000,
    
    /**
     * Token Type
     */
    Unknown      = 0b00000,
    FieldName    = 0b00001,
    Space        = 0b00010,
    Presence     = 0b00011,
    Term         = 0b00100,
    EditDistance = 0b00101,
    Boost        = 0b00110,
    Number       = 0b00111,
    
}

/**
 * Token Type Mask
 */
export const TypeMask = 0b00111;

/**
 * Token Attributes Mask
 */
export const AttributeMask = 0b11000;
