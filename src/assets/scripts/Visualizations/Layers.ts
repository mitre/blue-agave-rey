import { GenericViewItem } from "./ViewBaseTypes/GenericViewItem";
import { Focus, FocusMask, Select, SelectMask, Visibility, VisibilityMask } from "./ViewBaseTypes/GeneralAttributes";

/**
 * Given an array of view items sorted by visual priority then subsorted by a
 * set of visual attributes, this function locates where each visual layer,
 * and each visual boundary, ends.
 *
 * ### Visual Layers
 * 
 * The `layers` array contains where each visual priority layer ends.
 * 
 * **Example**
 * 
 * Let `[0,0,1,1,1,2,2,4]` be a set of (sorted) items where each number
 * represents that item's visual priority. The derived layers array would
 * be `[2,5,7,0,8]`. Note: No items have a visual priority of `3`, so `0`
 * is set at that priority's index.
 * 
 * ### Visual Boundaries
 * 
 * The `bounds` array contains each index where a transition between two
 * different visual priorities **OR** two different visual attributes
 * occurred.
 * 
 * **Example**
 * 
 * Let `[9,9,9,9,8,8,8,3]` be the same set of (sorted) items where each
 * number represents that item's visual attributes. The derived bounds
 * array would be `[0,2,4,5,7,8]`. Note: The start of the array counts as a
 * boundary.
 * 
 * @param arr
 *  The array of items to evaluate.
 * @param depth
 *  The number of visual priorities.
 * @param mask
 *  The set of visual attributes that were sorted on.
 *  (Use 0 if there were none.)
 * @param getVisualPriority
 *  The function used to derive each item's visual priority.
 * @returns
 *  An object containing the derived layers and bounds.
 */
export function findLayerSegments(
    arr: Array<{ obj: GenericViewItem }>, depth: number,
    mask: number, getVisualPriority: (attrs: number) => number
): { layers: number[], bounds: number[] } {
    let layers = new Array(depth).fill(0);
    let bounds = [0];
    let end = arr.length - 1;
    if(0 < arr.length) {
        findMajorLayerSegments(
            arr, mask, 0, end >> 1, end, 
            layers, bounds, getVisualPriority
        );
        layers[getVisualPriority(arr[end].obj.attrs)] = arr.length;
    }
    bounds.push(arr.length);
    return { layers, bounds };
}

/**
 * Given an array of view items sorted by visual priority then subsorted by a
 * set of visual attributes, this function recursively locates where each
 * visual layer, and each visual boundary, ends.
 * @param array
 *  The array of items to evaluate.
 * @param mask
 *  The set of visual attributes that were sorted on.
 * @param l
 *  The left-most search index.
 * @param m
 *  The center-most search index.
 * @param r
 *  The right-most search index.
 * @param layers
 *  The array that stores the layer indices.
 * @param bounds
 *  The array that stores the bounds indices.
 * @param getVisualPriority
 *  The function used to derive each item's visual priority.
 */
function findMajorLayerSegments(
    arr: Array<{ obj: GenericViewItem }>, 
    mask: number, l: number, m: number, r: number,
    layers: number[], bounds: number[],
    getVisualPriority: (attrs: number) => number
) {
    let lv = getVisualPriority(arr[l].obj.attrs);
    let mv = getVisualPriority(arr[m].obj.attrs);
    let rv = getVisualPriority(arr[r].obj.attrs);
    if (lv !== mv) {
        if (m - l === 1) {
            layers[lv] = m;
            bounds.push(m);
        } else {
            findMajorLayerSegments(
                arr, mask, l, (l + m) >> 1, m,
                layers, bounds, getVisualPriority
            );
        }
    } else if (m - l !== 1) {
        findMinorLayerSegments(
            arr, mask, l, (l + m) >> 1, m, bounds
        );
    } else {
        let _lv = arr[l].obj.style & mask;
        let _mv = arr[m].obj.style & mask;
        if(_lv !== _mv) bounds.push(m);
    }
    if (mv !== rv) {
        if (r - m === 1) {
            layers[mv] = r;
            bounds.push(r);
        } else { 
            findMajorLayerSegments(
                arr, mask, m, (m + r) >> 1, r,
                layers, bounds, getVisualPriority
            );
        }
    } else if (r - m !== 1) {
        findMinorLayerSegments(
            arr, mask, m, (m + r) >> 1, r, bounds
        );
    } else {
        let _mv = arr[m].obj.style & mask;
        let _rv = arr[r].obj.style & mask;
        if(_mv !== _rv) bounds.push(r);
    }
}

/**
 * Given an array of view items sorted by a set of visual attributes, this
 * function recursively locates each index where a visual layer ends.
 * @param arr
 *  The array of items to evaluate.
 * @param mask
 *  The set of visual attributes that were sorted on.
 * @param l
 *  The left-most search index.
 * @param m
 *  The center-most search index.
 * @param r
 *  The right-most search index.
 * @param bounds
 *  The array that stores the bounds indices.
 */
function findMinorLayerSegments(
    arr: Array<{ obj: GenericViewItem }>, 
    mask: number, l: number, m: number, r: number, 
    bounds: number[]
) {
    let lv = arr[l].obj.style & mask;
    let mv = arr[m].obj.style & mask;
    let rv = arr[r].obj.style & mask;
    if (lv !== mv) {
        if (m - l === 1) {
            bounds.push(m);
        } else {
            findMinorLayerSegments(
                arr, mask, l, (l + m) >> 1, m, bounds
            );
        }
    }
    if (mv !== rv) {
        if (r - m === 1) {
            bounds.push(r);
        } else { 
            findMinorLayerSegments(
                arr, mask, m, (m + r) >> 1, r, bounds
            );
        }
    }
}

/**
 * Returns the visual priority of an item based on its visibility, focus, and
 * selection.
 * @param attrs
 *  The item's attributes.
 * @returns
 *  The item's visual priority.
 */
export function getVisualPriority(attrs: number) {
    switch(attrs & SelectMask) {
        default:
            switch(attrs & VisibilityMask) {
                case Visibility.Hidden:
                    return 0;
                default:
                    switch(attrs & FocusMask) {
                        default:
                            return 1;
                        case Focus.Focus:
                            return 2;       
                    }
            }
        case Select.Single:
        case Select.Multi:
            return 3;
    }
}

/**
 * Returns the visual priority of an item based on its selection.
 * @param attrs
 *  The item's attributes.
 * @returns
 *  The item's visual priority.
 */
export function getSimpleVisualPriority(attrs: number) {
    switch(attrs & SelectMask) {
        default:
            return 0
        case Select.Single:
        case Select.Multi:
            return 1;
    }
}
