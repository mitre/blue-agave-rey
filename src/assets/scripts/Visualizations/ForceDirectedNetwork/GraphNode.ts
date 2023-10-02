import { GenericViewNode } from "../ViewBaseTypes/GenericViewNode";

export interface GraphNode {
    id: string
    fx?: number
    fy?: number
    vx?: number
    vy?: number
    x?: number
    y?: number
    radius: number,
    obj: GenericViewNode,
    isFrozen?: boolean
}
