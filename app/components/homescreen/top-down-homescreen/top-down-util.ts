import {
    checkDirAndMoveIfPossible,
    HS3Element,
    HS3Folder,
    HS3Item,
    HS3LayoutParams
} from "@components/homescreen/3-homescreen/3_homescreenHandler";
import {clamp, doRectanglesOverlap, isSameElementWorklet} from "@components/homescreen/3-homescreen/3_util";
import {
    GRID_COLUMNS,
    GRID_ROWS,
    gridPointToPixel,
    gridToPx,
    pxToGrid,
    snapPxToGridAsPx
} from "@components/homescreen/move_algo";
import {SharedValue} from "react-native-reanimated";
import {ToastAndroid} from "react-native";
import {DragState4, FolderDisplayLevel} from "@components/homescreen/top-down-homescreen/top-down-hs-types";
import {PixelPoint} from "@components/homescreen/types";
import {Dirs, FOLDER_HOVER_OVERLAY_INSET} from "@components/homescreen/3-homescreen/3_item3";

export const generateTempItems =
    (tempItems: HS3Element[], visibleElements: HS3Element[], dragState: DragState4) => {
        "worklet"
        if (tempItems.length == 0) return []

        const impossibleElements: HS3Element[] = []

        for (let element of tempItems) {
            const tE = element.layout

            const isOutOfBounds = tE.x < 0 || tE.y < 0 || tE.x + tE.width - 1 >= GRID_COLUMNS || tE.y + tE.height - 1 >= GRID_ROWS
            const itemBlocks = visibleElements
                .filter(o =>
                    !isSameElementWorklet(element, o)
                    && !isSameElementWorklet(o, dragState.element))
                .some((otherItem) => {
                    return doRectanglesOverlap(tE, otherItem.layout)
                })

            if (itemBlocks || isOutOfBounds)
                impossibleElements.push(element)
        }

        return impossibleElements
    };


export const getModifiedTempItems = (
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
            console.log("parent", parent,)
            folders1 = folders1.map(
                f => f.folderId === parent.folderId
                    ? parent : f
            )
        }
    }

    return folders1
}

export const addToNewFolder = (
    draggedElement: HS3Element,
    stationaryElement: HS3Element,
    folders: HS3Folder[],
    currentLevel: number
) => {
    const highestId: number = folders
        .reduce(
            (prev, curr) =>
                (prev > curr.folderId)
                    ? prev : curr.folderId,
            -1
        )

    const newFolder: HS3Folder = {
        folderId: highestId + 1,
        layout: stationaryElement.layout,
        parentId: currentLevel,
        items: []
    }

    let folders1 = [...folders, newFolder]

    const reparentElement =
        (e: HS3Element, itemsAdded: HS3Element[], folders2: HS3Folder[]) => {
            // change layout
            const index = itemsAdded.indexOf(e)

            const newPoint = (index === 0)
                ? {x: 0, y: 0}
                : {x: itemsAdded[0].layout.width, y: 0}


            e.layout = {
                ...e.layout,
                ...newPoint,
            }

            //if item:
            if ("itemId" in e) {
                //     get parent
                const parent = folders2.find(
                    f => f.folderId === e.parentId)
                //     remove item from items
                parent.items = parent.items.filter(i => i.itemId !== e.itemId)

                //     add to new parent
                newFolder.items.push(e)
            } else {
                folders1 = folders2.map(f =>
                    (f.folderId === e.folderId)
                        ? e : f
                )
            }

            // ->
            //     change parentId
            e.parentId = newFolder.folderId

            console.log("newLayout", e)
        }
    const elements = [draggedElement, stationaryElement]
    for (let e of elements) {
        reparentElement(e, elements, folders1)
    }

    // let draggedElementAdded = false
    // draggedElement.layout = {
    //     ...draggedElement.layout,
    //     x: 0, y: 0
    // }
    // if ("itemId" in draggedElement) {
    //     const parent = folders1.find(f => f.folderId === draggedElement.parentId)
    //     parent.items = parent.items.filter(i => i.itemId !== draggedElement.itemId)
    //
    //     newFolder.items.push(draggedElement)
    // }
    // draggedElement.parentId = newFolder.folderId
    //
    // stationaryElement.layout = {
    //     ...stationaryElement.layout,
    //     x: 1,//col,
    //     y: 0//row,
    // }
    // if ("itemId" in stationaryElement) {
    //     const parent = folders1.find(f => f.folderId === stationaryElement.parentId)
    //     parent.items = parent.items.filter(i => i.itemId !== stationaryElement.itemId)
    //
    //     newFolder.items.push(stationaryElement)
    // }
    // draggedElement.parentId = newFolder.folderId


    console.log("finished creating!")
    return folders1
}


type ElementWithDirs = {
    element: HS3Element,
    dirs: CheckDirsReturnType
}

export function createTempElements(
    itemResults: ElementWithDirs[],
    previewElement: HS3Element,
    visibleElements: HS3Element[],
    isAddFolder: HS3Element | undefined,
) {
    "worklet"
    if (!itemResults || itemResults.length === 0 || !!isAddFolder)
        return []

    const {layout: targetLayout} = previewElement;
    const newTempItems: HS3Element[] = []
    let tempTempItem: HS3Element | undefined = undefined

    for (let result of itemResults) {
        const {element, dirs: {dirs}} = result
        tempTempItem = undefined

        for (let dir of dirs) {
            switch (dir) {
                case Dirs.moveRight:
                    tempTempItem = checkDirAndMoveIfPossible(element, {
                        x: targetLayout.x + targetLayout.width,
                        y: element.layout.y
                    },)
                    break;
                case Dirs.moveLeft:
                    tempTempItem = checkDirAndMoveIfPossible(element, {
                        x: targetLayout.x - element.layout.width,
                        y: element.layout.y
                    }, [])
                    break;
                case Dirs.moveUp:
                    tempTempItem = checkDirAndMoveIfPossible(element, {
                        x: element.layout.x,
                        y: targetLayout.y + targetLayout.width
                    })
                    break;
                case Dirs.moveDown:
                    tempTempItem = checkDirAndMoveIfPossible(element, {
                        x: element.layout.x,
                        y: targetLayout.y - element.layout.height
                    }, [])
                    break;
            }

            if (!!tempTempItem) {
                newTempItems.push(tempTempItem)
                break;
            }
        }
    }

    return newTempItems;
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


export function getTargetLayout4(dragState: DragState4): HS3Element {
    "worklet"
    const {coordinate: dragCoordinate, element} = dragState

    const layout: HS3LayoutParams = {
        x: clamp(
            pxToGrid(snapPxToGridAsPx(dragCoordinate.x - gridToPx(element.layout.width) / 2)),
            0, GRID_COLUMNS - element.layout.width
        ),
        y: clamp(
            pxToGrid(snapPxToGridAsPx(dragCoordinate.y - gridToPx(element.layout.height) / 2)),
            0, GRID_COLUMNS - element.layout.height
        ),
        width: element.layout.width,
        height: element.layout.height,
    }

    return {
        ...element,
        layout: {...layout}
    }
}

export const goUpLevel = (currentLevel: SharedValue<number>, folders: SharedValue<HS3Folder[]>) => {
    if (currentLevel.value === undefined) {
        ToastAndroid.show("Already at root level", ToastAndroid.SHORT)
        return
    }

    currentLevel.value = getFoldersForLevel(folders.value, currentLevel.value)
        .main.parentId || undefined
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

export function generateItemResults(dragState: DragState4 | undefined, previewElement: HS3Element, visibleElements: HS3Element[]) {
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