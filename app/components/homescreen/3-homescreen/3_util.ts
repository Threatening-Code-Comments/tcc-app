import {GRID_COLUMNS, gridToPx, pxToGrid, snapPxToGridAsPx} from "@components/homescreen/move_algo";
import {DragState, HS3Element, HS3LayoutParams} from "@components/homescreen/3-homescreen/3_homescreenHandler";

export const clamp = (num, min, max) => {
    "worklet"
    return Math.min(Math.max(num, min), max)
}

export function getTargetLayout(dragState: DragState): HS3LayoutParams {
    "worklet"
    const {coordinate: dragCoordinate, draggingItem} = dragState

    return {
        x: clamp(
            pxToGrid(snapPxToGridAsPx(dragCoordinate.x - gridToPx(draggingItem.layout.width) / 2)),
            0, GRID_COLUMNS - draggingItem.layout.width
        ),
        y: clamp(
            pxToGrid(snapPxToGridAsPx(dragCoordinate.y - gridToPx(draggingItem.layout.height) / 2)),
            0, GRID_COLUMNS - draggingItem.layout.height
        ),
        width: draggingItem.layout.width,
        height: draggingItem.layout.height,
    }
}

export function getElementId(e: HS3Element) {
    return "itemId" in e ? e.itemId : e.folderId;
}

export function getElementKey(e: HS3Element) {
    return (!e)
        ? undefined
        : "itemId" in e ? "t" + e.itemId : "f" + e.folderId;
}

function getElementKeyW(e: HS3Element) {
    "worklet"
    return "itemId" in e ? "t" + e.itemId : "f" + e.folderId;
}

export function isSameElement(e?: HS3Element, e2?: HS3Element): boolean {
    // if (!e && !!e2 || !!e && !e2) return false
    return getElementKey(e) === getElementKey(e2)
}

export function isSameElementWorklet(e?: HS3Element, e2?: HS3Element): boolean {
    "worklet"
    return getElementKeyW(e) === getElementKeyW(e2)
}


export function doRectanglesOverlap(r1: HS3LayoutParams, r2: HS3LayoutParams) {
    "worklet"
    if (r1.x >= r2.x + r2.width || r2.x >= r1.x + r1.width)
        return false
    if (r1.y >= r2.y + r2.height || r2.y >= r1.y + r1.height)
        return false
    return true
}