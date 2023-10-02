import { GenericViewNode } from "../ViewBaseTypes/GenericViewNode";

export interface TimelineTick {
    x: number,
    y0: number,
    y1: number,
    time: Date,
    obj: GenericViewNode
}
