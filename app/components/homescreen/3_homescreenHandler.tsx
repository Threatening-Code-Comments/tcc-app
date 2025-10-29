import React from "react";
import {GridPoint, PixelPoint} from "@components/homescreen/types";
import Item3, {checkDirectionsForItem, Dirs, FOLDER_HOVER_OVERLAY_INSET} from "@components/homescreen/3_item3";
import Animated, {
    runOnJS, SharedValue,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue
} from "react-native-reanimated";
import {
    GRID_COLUMNS,
    GRID_ROWS,
    GRID_UNIT,
    gridPointToPixel,
    gridToPx,
    pxToGrid,
    snapPxToGridAsPx
} from "@components/homescreen/move_algo";
import {IconButton} from "@components/IconButton";
import {View} from "react-native";
import {useRouter} from "expo-router";
import {PreviewItem3} from "@components/homescreen/3_previewItem";

export type HS3LayoutParams = GridPoint & {
    width: number;
    height: number;
}

export type HS3Element = HS3Item | HS3Folder

export type HS3Item = {
    itemId: number
} & HS3Layout;
export type HS3Folder = {
    folderId: number
    items: HS3Item[]
} & HS3Layout;
export type HS3Layout = {
    layout: HS3LayoutParams;
    parentId?: number;
}

export function getElementId(e: HS3Element) {
    return "itemId" in e ? e.itemId : e.folderId;
}

export function getElementKey(e: HS3Element) {
    return "itemId" in e ? "" + e.itemId : "f" + e.folderId;
}

export function isSameElement(e?: HS3Element, e2?: HS3Element): boolean {
    if (!e || !e2) return false

    return "itemId" in e
        ? "itemId" in e2
            ? e.itemId === e2.itemId
            : false
        : "folderId" in e2
            ? e.folderId === e2.folderId
            : false
}

export function isSameElementWorklet(e?: HS3Element, e2?: HS3Element): boolean {
    "worklet"
    if (!e || !e2) return false

    return "itemId" in e
        ? "itemId" in e2
            ? e.itemId === e2.itemId
            : false
        : "folderId" in e2
            ? e.folderId === e2.folderId
            : false
}


export type DragState = {
    coordinate: PixelPoint
    draggingItem: HS3Item
}

type ItemWithOptions = {
    item: HS3Item
    isAddFolder?: boolean
}

//sets tempItems
const checkDirAndMoveIfPossible: (item: HS3Element, targetPosition: {
    x: number,
    y: number
}, items: ItemWithOptions[], tempItems: SharedValue<HS3Element[]>) => HS3Element | undefined
    = (item, targetPosition, items, tempItems) => {
    "worklet"
    const {layout} = item
    const itemCoords = {
        x: targetPosition.x,
        y: targetPosition.y,
    }
    const itemMax = {
        x: itemCoords.x + layout.width,
        y: itemCoords.y + layout.height
    }

    // let success = false
    // for (let x = itemCoords.x; x < itemCoords.x + layout.width; x++) {
    //     for (let y = itemCoords.y; y < itemCoords.y + layout.height; y++) {
    //         if (x < 0 || y < 0 || x + layout.width >= GRID_COLUMNS || y + layout.height >= GRID_ROWS) {
    //             success = false;
    //             // break
    //             return undefined
    //         }
    //         const valueAtPoint = items.filter(i =>
    //             i.item.layout.x >= x && x <= itemMax.x
    //             && i.item.layout.y >= y && y <= itemMax.y
    //         )
    //         if (!valueAtPoint) {
    //             success = true;
    //         }
    //         // success = (dragState.value?.draggingItem.itemId === valueAtPoint[0].item.itemId)
    //         success = true
    //         if (!success) {
    //             // break
    //             return undefined
    //         }
    //     }
    // }

    const newItem: HS3Element = {
        ...item,
        layout: {
            ...item.layout,
            ...itemCoords
        }
    }

    // const isPossible = tempItems.value.map(i => !isSameElement(i, newItem)).reduce((p, c) => p && c)
    // console.log("HALO")
    // if (isPossible) {
    // tempItem.value = newItem;
    return newItem
    // runOnJS(setRefresh)(prev => !prev);
// }

    // return undefined
}

export function doRectanglesOverlap(r1: HS3LayoutParams, r2: HS3LayoutParams) {
    "worklet"
    if (r1.x >= r2.x + r2.width || r2.x >= r1.x + r1.width)
        return false
    if (r1.y >= r2.y + r2.height || r2.y >= r1.y + r1.height)
        return false
    return true
}

export function getTargetLayout(dragState: DragState): HS3LayoutParams {
    "worklet"
    const {coordinate: dragCoordinate, draggingItem} = dragState
    return {
        x: pxToGrid(snapPxToGridAsPx(dragCoordinate.x - gridToPx(draggingItem.layout.width) / 2)),
        y: pxToGrid(snapPxToGridAsPx(dragCoordinate.y - gridToPx(draggingItem.layout.height) / 2)),
        width: draggingItem.layout.width,
        height: draggingItem.layout.height,
    }
}

type Props = {
    items: HS3Item[];
}
const HomescreenHandler3 = ({items: itemsP}: Props) => {
    const setItemsFromP = (items: typeof itemsP) =>
        items.map(i => ({item: i, isAddFolder: false}));

    const router = useRouter();
    const [items, setItems] = React.useState<ItemWithOptions[]>(setItemsFromP(itemsP));
    const [folders, setFolders] = React.useState([]);

    const [refresh, setRefresh] = React.useState(false);

    // const [tempItems, setTempItems] = React.useState<HS3Element[]>([]);

    // hier item results hin!!!!!!!!!!!!!!!
    const dragState = useSharedValue<DragState | undefined>(undefined);

    const itemResults = useDerivedValue(() => {
        if (!dragState.value) return []

        // alle punkte die das item belegen wird
        // PixelPoint[]

        const targetLayout = getTargetLayout(dragState.value)

        const res = items.filter(i => i.item.itemId !== dragState.value.draggingItem.itemId)
            .map(i =>
                ({
                    item: i,
                    dirs: checkDirectionsForItem(i.item, dragState.value.coordinate, doRectanglesOverlap(targetLayout, i.item.layout))
                })
            ).filter(i => (i.dirs.dirs.length > 0 || i.dirs.isAddFolder))
        return res
    }, [dragState, items])

    const isAddFolder = useDerivedValue<HS3Item | undefined>(() => {
        if (!dragState.value) return undefined

        for (let result of itemResults.value) {
            const {item: {item}, dirs: {isAddFolder: isAddFolderP}} = result

            if (isAddFolderP) return item
        }
        return undefined
    }, [itemResults])
    const tempItems = useDerivedValue<HS3Element[]>(() => {
        if (itemResults.value.length == 0 ||
            !!isAddFolder.value) return []

        const newTempItems: HS3Element[] = []
        let tempTempItem = undefined

        const targetLayout = getTargetLayout(dragState.value)

        for (let result of itemResults.value) {
            const {item, dirs: {dirs}} = result;
            tempTempItem = undefined

            // targetX + currWidth = targetLayoutX

            switch (dirs[0]) {
                case Dirs.moveRight:
                    tempTempItem = checkDirAndMoveIfPossible(item.item, {x: targetLayout.x + targetLayout.width, y: item.item.layout.y}, items, tempItems)
                    break;
                case Dirs.moveLeft:
                    tempTempItem = checkDirAndMoveIfPossible(item.item, {x: targetLayout.x - item.item.layout.width, y: item.item.layout.y}, items, tempItems)
                    break;
                case Dirs.moveUp:
                    tempTempItem = checkDirAndMoveIfPossible(item.item, {x: item.item.layout.x, y: targetLayout.y + targetLayout.width}, items, tempItems)
                    break;
                case Dirs.moveDown:
                    tempTempItem = checkDirAndMoveIfPossible(item.item, {x: item.item.layout.x, y: targetLayout.y - item.item.layout.height}, items, tempItems)
                    break;
            }

            if (!!tempTempItem)
                newTempItems.push(tempTempItem)
            else if (dirs.length)
                console.log("COULD NOT CREATE TEMPTEMPITEM")
        }

        return newTempItems
    }, [itemResults, isAddFolder, items])

    const tempItemsImpossible = useDerivedValue(() => {
        if (tempItems.value.length == 0) return []

        const impossibleItems: HS3Element[] = []

        for (let item of tempItems.value) {
            const tI = item.layout

            const isOutOfBounds = tI.x < 0 || tI.y < 0 || tI.x + tI.width - 1 >= GRID_COLUMNS || tI.y + tI.height - 1 >= GRID_ROWS
            const itemBlocks = items.filter(o => !isSameElementWorklet(item, o.item) && !isSameElementWorklet(o.item, dragState.value.draggingItem)).some((otherItem) => {
                return doRectanglesOverlap(tI, otherItem.item.layout)
            })

            if (itemBlocks || isOutOfBounds) {
                impossibleItems.push(item)
            }
        }

        return impossibleItems
    }, [tempItems, items])

    useAnimatedReaction(() => tempItems.value,
        (current, previous) => {
            if (JSON.stringify(current) != JSON.stringify(previous))
                runOnJS(setRefresh)(prev => !prev)
        }, [tempItems])

    const onDragUpdate = (item: HS3Item, point: PixelPoint) => {
        dragState.value = {
            draggingItem: item,
            coordinate: point,
        }
    }
    const onDragEnd = (item: HS3Item, newCoordinate: PixelPoint) => {
        const isImpossible = tempItemsImpossible.value.length > 0

        dragState.value = undefined

        console.log("ondragend", isImpossible)
        if (isImpossible) {
            runOnJS(setRefresh)(prev => !prev)
            return
        }

        const modifiedItem: ItemWithOptions = {
            item: {
                ...item,
                layout: {
                    ...item.layout,
                    x: pxToGrid(newCoordinate.x),
                    y: pxToGrid(newCoordinate.y),
                }
            }, isAddFolder: false
        }

        //set new items
        setItems(prev => prev.map(i => {
            if (i.item.itemId === item.itemId)
                return modifiedItem
            const sameTempItem = tempItems.value.find(tmp => isSameElement(i.item, tmp))
            if (sameTempItem)
                return {item: sameTempItem as HS3Item, isAddFolder: false}
            return i
        }))
    }

    const folderOverlayStyle = useAnimatedStyle(() => {
        if (!isAddFolder.value) return {backgroundColor: 'transparent'};

        const {layout: {x, y, width, height}} = isAddFolder.value

        const pxVals = {
            ...gridPointToPixel({x, y}),
            width: gridToPx(width), height: gridToPx(height)
        }

        const n = FOLDER_HOVER_OVERLAY_INSET

        return {
            position: 'absolute',
            // position: 'relative',
            left: pxVals.x + (pxVals.width * (1 - n) / 2),
            top: pxVals.y + (pxVals.height * (1 - n) / 2),
            width: pxVals.width * n,
            height: pxVals.height * n,
            backgroundColor: 'green',
            zIndex: 7
        }
    }, [isAddFolder.value]);

    const gridUnit = GRID_UNIT;
    return (<>

        <View style={{height: 50, marginTop: -100, justifyContent: "flex-start"}}>
            <IconButton
                iconName="refresh"
                text="Refresh"
                onPress={() => {
                    router.navigate(`/pages/0`);
                }}
            />
        </View>

        {/*Temp Item*/}
        {tempItems.value.map(i => (
            <PreviewItem3
                key={getElementKey(i)}
                element={i}
                impossible={tempItemsImpossible.value.some(i2 => isSameElement(i, i2))}
            />
        ))}

        {/*Folder Overlay*/}
        <Animated.View style={folderOverlayStyle}/>

        {items.filter(i => !tempItems.value.some(tmp => isSameElement(i.item, tmp))).map((entry) => (
                <Item3
                    key={entry.item.itemId}
                    {...entry.item}
                    onDragUpdate={onDragUpdate.bind(null, entry.item)}
                    handleDragEnd={onDragEnd.bind(null, entry.item)}
                    snapToNearestGridPoint={snapPxToGridAsPx}
                    gridUnit={gridUnit}
                />
            )
        )}

    </>)
}

export default HomescreenHandler3;