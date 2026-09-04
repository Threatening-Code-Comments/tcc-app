import {Dirs, HS3Element, HS3Folder, HS3Item, HS3LayoutParams} from "./types";
import {
    GRID_COLUMNS,
    GRID_ROWS,
    gridPointToPixel,
    gridToPx,
    pxToGrid,
    snapPxToGridAsPx
} from "@components/homescreen/move_algo";
import {DragState, FolderDisplayLevel, PixelPoint, Tile} from "@components/homescreen/types";
import {FOLDER_HOVER_OVERLAY_INSET} from "@components/homescreen/constants"

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
    return !(r1.y >= r2.y + r2.height || r2.y >= r1.y + r1.height);

}

export const checkDirAndMoveIfPossible: (element: HS3Element, targetPosition: {
    x: number,
    y: number
}) => HS3Element | undefined
    = (element, targetPosition) => {
    "worklet"
    const elementCoords = {
        x: targetPosition.x,
        y: targetPosition.y,
    }

    const newElement: HS3Element = {
        ...element,
        layout: {
            ...element.layout,
            ...elementCoords
        }
    }

    return newElement
}

export const generateTempElements =
    (elements: HS3Element[], visibleElements: HS3Element[], dragState: DragState) => {
        "worklet"
        if (elements.length == 0) return []

        const impossibleElements: HS3Element[] = []

        for (let element of elements) {
            const tE = element.layout

            const isOutOfBounds = tE.x < 0 || tE.y < 0 || tE.x + tE.width - 1 >= GRID_COLUMNS || tE.y + tE.height - 1 >= GRID_ROWS
            const elementBlocks = visibleElements
                .filter(o =>
                    !isSameElementWorklet(element, o)
                    && !isSameElementWorklet(o, dragState.element))
                .some((otherElement) => {
                    return doRectanglesOverlap(tE, otherElement.layout)
                })

            if (elementBlocks || isOutOfBounds)
                impossibleElements.push(element)
        }

        return impossibleElements
    };

export const getRandomColor = () => rainbow(512, Math.floor(Math.random() * 512))

/**
 * @param numOfSteps Total number steps to get color, means total colors
 * @param step The step number, means the order of the color
 */
export function rainbow(numOfSteps: number, step: number) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    let r, g, b;
    let h = step / numOfSteps;
    let i = ~~(h * 6);
    let f = h * 6 - i;
    let q = 1 - f;
    switch (i % 6) {
        case 0:
            r = 1;
            g = f;
            b = 0;
            break;
        case 1:
            r = q;
            g = 1;
            b = 0;
            break;
        case 2:
            r = 0;
            g = 1;
            b = f;
            break;
        case 3:
            r = 0;
            g = q;
            b = 1;
            break;
        case 4:
            r = f;
            g = 0;
            b = 1;
            break;
        case 5:
            r = 1;
            g = 0;
            b = q;
            break;
    }
    let c = "#" + ("00" + (~~(r * 255)).toString(16)).slice(-2) + ("00" + (~~(g * 255)).toString(16)).slice(-2) + ("00" + (~~(b * 255)).toString(16)).slice(-2);
    return (c);
}

export const getModifiedTempElements = (
    elementsToModify: HS3Element[],
    folders: HS3Folder[],
) => {
    let folders1 = folders

    for (let tempElement of elementsToModify) {
        if ("folderId" in tempElement) {
            folders1 = folders1.map(
                f =>
                    //@ts-ignore
                    f.folderId === tempElement.folderId
                        ? tempElement as HS3Folder
                        : f
            )
        } else {
            const parent = folders1.find(
                f => f.folderId === tempElement.parentId
            )
            parent.items = parent.items.map(
                //@ts-ignore
                i => i.itemId === tempElement.itemId
                    ? tempElement as HS3Item
                    : i
            )
            folders1 = folders1.map(
                f => f.folderId === parent.folderId
                    ? parent : f
            )
        }
    }

    return folders1
}


type ElementWithDirs = {
    element: HS3Element,
    dirs: CheckDirsReturnType
}

export function createTempElements(
    elementResults: ElementWithDirs[],
    previewElement: HS3Element,
    visibleElements: HS3Element[],
    isAddFolder: HS3Element | undefined,
) {
    "worklet"
    if (!elementResults || elementResults.length === 0 || !!isAddFolder)
        return []

    const {layout: targetLayout} = previewElement;
    const newTempElements: HS3Element[] = []
    let tempElement: HS3Element | undefined = undefined

    for (let result of elementResults) {
        const {element, dirs: {dirs}} = result
        tempElement = undefined

        for (let dir of dirs) {
            switch (dir) {
                case Dirs.moveRight:
                    tempElement = checkDirAndMoveIfPossible(element, {
                        x: targetLayout.x + targetLayout.width,
                        y: element.layout.y
                    })
                    break;
                case Dirs.moveLeft:
                    tempElement = checkDirAndMoveIfPossible(element, {
                        x: targetLayout.x - element.layout.width,
                        y: element.layout.y
                    })
                    break;
                case Dirs.moveUp:
                    tempElement = checkDirAndMoveIfPossible(element, {
                        x: element.layout.x,
                        y: targetLayout.y + targetLayout.width
                    })
                    break;
                case Dirs.moveDown:
                    tempElement = checkDirAndMoveIfPossible(element, {
                        x: element.layout.x,
                        y: targetLayout.y - element.layout.height
                    })
                    break;
            }

            if (!!tempElement) {
                newTempElements.push(tempElement)
                break;
            }
        }
    }

    return newTempElements;
}

type CheckDirsReturnType = {
    dirs: Dirs[]
    isAddFolder: boolean
}
export const checkDirectionsForElement: (element: HS3Element, point: PixelPoint, doesCollide: boolean) => CheckDirsReturnType
    = (element, point, doesCollide) => {
    "worklet"

    if (!doesCollide)
        return {dirs: [], isAddFolder: false}

    const {x, y} = point
    const n = FOLDER_HOVER_OVERLAY_INSET;

    const o = gridPointToPixel({x: element.layout.x, y: element.layout.y})
    const wO = gridToPx(element.layout.width)
    const hO = gridToPx(element.layout.height)

    const wiX = wO * n
    const wiY = hO * n
    const siX = (wO * (1 - n)) / 2
    const siY = (hO * (1 - n)) / 2

    const dirs = []
    // const isMoveRight =
    //     (o.x) < x && x < (o.x + siX) // hits left most space between item border and
    //     && (o.y) < y && y < (o.y + hO)  // folder creation thing
    // const isMoveLeft =
    //     (o.x + siX + wiX) < x && x < (o.x + wO) // left side is capped, only the right
    //     && (o.y) < y && y < (o.y + hO)                // side
    // const isMoveDown =
    //     (o.x) < x && x < (o.x + wO)
    //     && (o.y) < y && y < (o.y + siY)       // top space is target
    // const isMoveUp =
    //     (o.x) < x && x < (o.x + wO)
    //     && (o.y + siY + wiY) < y && y < (o.y + hO)  // bottom space is target
    const isMoveRight = point.x < o.x + siX // is to the left of folder creation thing (because we know there is a collision)
    const isMoveLeft = point.x > o.x + siX + wiX // is to the right of folder creation thing (because we know there is a collision)
    const isMoveUp = point.y < o.y + siY
    const isMoveDown = point.y > o.y + siY + wiY

    const isAddFolder =
        (o.x + siX) < x && x < (o.x + siX + wiX)
        && (o.y + siY) < y && y < (o.y + siY + wiY)

    if (isMoveRight) dirs.push(Dirs.moveRight)
    if (isMoveLeft) dirs.push(Dirs.moveLeft)
    if (isMoveDown) dirs.push(Dirs.moveDown)
    if (isMoveUp) dirs.push(Dirs.moveUp)

    return {
        dirs: dirs,
        isAddFolder: isAddFolder,
    }
}
export const clamp = (num, min, max) => {
    "worklet"
    return Math.min(Math.max(num, min), max)
}

export function getTargetLayout(dragState: DragState): HS3Element {
    "worklet"
    const {coordinate: dragCoordinate, element} = dragState

    const layout: HS3LayoutParams = {
        x: clamp(
            pxToGrid(snapPxToGridAsPx(dragCoordinate.x - gridToPx(element.layout.width) / 2)),
            0, GRID_COLUMNS - element.layout.width
        ),
        y: clamp(
            pxToGrid(snapPxToGridAsPx(dragCoordinate.y - gridToPx(element.layout.height) / 2)),
            0, GRID_ROWS - element.layout.height
        ),
        width: element.layout.width,
        height: element.layout.height,
    }

    return {
        ...element,
        layout: {...layout}
    }
}

export const getParentLevel = (folders: HS3Folder[], level: number | undefined): number | undefined => {
    return getFoldersForLevel(folders, level).main?.parentId ?? undefined
}

export const getFoldersForLevel
    : (folderList: HS3Folder[], level: number | undefined) => FolderDisplayLevel
    = (folderList, level) => {
    "worklet"
    if (!folderList) return {main: undefined, more: undefined}
    return {
        main: folderList.find(f => f.folderId === level),
        more: folderList.filter(f => f.parentId === level && f.folderId !== level),
    }
}

//path from root to the current folder, e.g. [Home, Essen, Döner]
export const getFolderPath = (folderList: HS3Folder[], level: number | undefined): HS3Folder[] => {
    "worklet"
    if (!folderList || level === undefined) return []

    const path: HS3Folder[] = []
    let current = folderList.find(f => f.folderId === level)
    while (current) {
        path.unshift(current)
        if (current.parentId === undefined) break
        current = folderList.find(f => f.folderId === current.parentId)
    }
    return path
}

export function generateElementResults(dragState: DragState | undefined, previewElement: HS3Element, visibleElements: HS3Element[]) {
    "worklet"
    if (!dragState || !previewElement) return undefined

    return visibleElements.filter(e =>
        !isSameElementWorklet(e, dragState.element))
        .map(e => ({
            element: e,
            // type: ("folderId" in e ? "folder" : "item"),
            dirs: checkDirectionsForElement(e, dragState.coordinate, doRectanglesOverlap(previewElement.layout, e.layout))
        })).filter(e => (e.dirs.dirs.length > 0 || e.dirs.isAddFolder))
}

export function getElementPath(e: HS3Element, folders: HS3Folder[]) {
    if (!e) return ""
    const parentId = e.parentId

    if (parentId === undefined) {
        return "/"
    } else {
        const parent = folders.find(f => f.folderId === parentId)
        return getElementPath(parent, folders) + getElementKey(parent) + "/"
    }
}

export function getNextId(type: "item" | "folder", folders: HS3Folder[]) {
    if (type == "item") {
        //e is item
        const items = folders.flatMap(f => f.items)
        const highest = items.reduce(
            (prev, curr) =>
                (prev > curr.itemId)
                    ? prev : curr.itemId,
            -1
        )
        return highest + 1
    } else {
        //e is folder
        const highest = folders.reduce(
            (prev, curr) =>
                (prev > curr.folderId)
                    ? prev : curr.folderId,
            -1
        )
        return highest + 1
    }
}

export function getNextTileId(tiles: Tile[]): number {
    return tiles.reduce((prev, curr) => (prev > curr.id) ? prev : curr.id, -1) + 1
}