import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { IconButton } from '../IconButton';
import Item from './item'; // Einzelnes Item, das vom Handler gesteuert wird
import { ValueOf } from 'react-native-gesture-handler/lib/typescript/typeUtils';
import { PlacementGrid } from './placementGrid';

// Basierend auf Bildschirmgröße
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_COLUMNS = 4;
const GRID_ROWS = 5;
const GRID_UNIT = Math.min(SCREEN_WIDTH / GRID_COLUMNS, SCREEN_HEIGHT / GRID_ROWS);

const snapPxToGridAsPx = (value: number) => {
    "worklet"
    return Math.round(value / GRID_UNIT) * GRID_UNIT;
}
const pxToGrid = (value: number) => {
    return Math.round(value / GRID_UNIT);
}
const gridToPx = (value: number) => {
    return value * GRID_UNIT;
}

const getCoordinateDiff = (movedItemCoordinate: number, blockingItemCoordinate: number, blockingItemSize: number) => {
    const diff1 = movedItemCoordinate - blockingItemCoordinate
    const diff2 = movedItemCoordinate - blockingItemCoordinate + blockingItemSize
    return Math.abs(diff1) < Math.abs(diff2) ? diff1 : diff2
}

const pixelToGrid = (pixel: PixelPoint) => ({ x: pxToGrid(pixel.x), y: pxToGrid(pixel.y) })

const getPointsOfTile = (tile: PixelTile | GridTile, isPixelTile: boolean) => {
    const movedItemToCoordinate = isPixelTile ? pixelToGrid(tile) : tile
    const width = isPixelTile ? pxToGrid(tile.width) : tile.width
    const height = isPixelTile ? pxToGrid(tile.height) : tile.height

    const movedItemPoints: GridPoint[] = []
    for (let i = movedItemToCoordinate.x; i < movedItemToCoordinate.x + Math.max(1, width); i++) {
        for (let j = movedItemToCoordinate.y; j < movedItemToCoordinate.y + Math.max(1, height); j++) {
            movedItemPoints.push({ x: i, y: j })
        }
    }
    return movedItemPoints
}

export type GridPoint = {
    x: number
    y: number
};

export type GridTile = GridPoint & {
    width: number
    height: number
}

export type PixelPoint = {
    x: number
    y: number
}

export type PixelTile = PixelPoint & {
    width: number
    height: number
}

export type GridPlacementList = PlacementGrid //(GridPoint & { item: HomescreenItem })[]

export type HomescreenItem = GridTile & {
    id: number
}

export const HomeScreenHandler = (props: { items: HomescreenItem[] }) => {
    const [items, setItems] = useState(props.items);
    const [tempItems, setTempItems] = useState<HomescreenItem[]>([])
    const [placementGrid, setPlacementGrid] = useState<GridPlacementList>(new PlacementGrid(GRID_COLUMNS, GRID_ROWS))

    useEffect(() => {
        setPlacementGrid(() => {
            const grid = new PlacementGrid(GRID_COLUMNS, GRID_ROWS)
            items.forEach((item) => grid.addItem(item))
            return grid
        })
    }, [items])

    const handleDragEnd = (id: number, pixel: PixelPoint) => {
        const newPosition = pixelToGrid(pixel);

        setItems((prevItems) => prevItems.map((item) => {
            if (item.id === id) {
                const updatedItem = { ...item, ...newPosition };
                return updatedItem;
            }
            return item;
        }))

        setTempItems([])
    };

    const makeSpaceForItem = (movedItem: PixelTile & { id: number }) => {
        const movedItemPoints = getPointsOfTile(movedItem, true)

        const blockingItemsTemp = movedItemPoints
            .map((point) => placementGrid.getItemAtPosition(point))
            .filter((entry) => entry && entry.id !== movedItem.id)

        //if no items are blocking:
        if (blockingItemsTemp.length === 0) {
            setTempItems([])
            return
        }

        const movedItemToCoordinate = pixelToGrid(movedItem)
        const movedPlacementGrid = placementGrid.getCopyWithItemReplaced({
            id: movedItem.id,
            ...movedItemToCoordinate,
            width: pxToGrid(movedItem.width),
            height: pxToGrid(movedItem.height)
        })

        for (let item of blockingItemsTemp) {
            const itemPoints = getPointsOfTile(item, false)
            const itemX = gridToPx(item.x)
            const itemY = gridToPx(item.y)
            const itemWidth = gridToPx(item.width)
            const itemHeight = gridToPx(item.height)

            const xDiff = getCoordinateDiff(movedItem.x, itemX, itemWidth)  //movedItem.x - gridToPx(item.x)
            const yDiff = getCoordinateDiff(movedItem.y, itemY, itemHeight)  //movedItem.y - gridToPx(item.y)

            const intersectingPoints = itemPoints.filter(p => movedItemPoints.some(p2 => PlacementGrid.isSamePoint(p, p2)))
            const intersectionSizeX = new Set(intersectingPoints.map(p => p.x)).size
            const intersectionSizeY = new Set(intersectingPoints.map(p => p.y)).size
            // console.log(item, movedItemPoints, itemPoints)
            // console.log(intersectingPoints, intersectionSizeX, intersectionSizeY)

            const intersectionMinX = itemPoints.reduce((prev, cur) => Math.min(prev, cur.x), Number.MAX_VALUE)
            const intersectionMaxX = itemPoints.reduce((prev, cur) => Math.max(prev, cur.x), Number.MIN_VALUE)
            const intersectionMinY = itemPoints.reduce((prev, cur) => Math.min(prev, cur.y), Number.MAX_VALUE)
            const intersectionMaxY = itemPoints.reduce((prev, cur) => Math.max(prev, cur.y), Number.MIN_VALUE)

            const checkLeft = () => movedPlacementGrid.checkLeftBorder(intersectionMinX, item.y, item.width, item.height, item.id, true, intersectionSizeX);
            const checkUp = () => movedPlacementGrid.checkLeftBorder(intersectionMinY, item.x, item.height, item.width, item.id, false, intersectionSizeY);
            const checkRight = () => movedPlacementGrid.checkRightBorder(intersectionMinX, item.y, item.width, item.height, item.id, true, intersectionSizeX);
            const checkDown = () => movedPlacementGrid.checkRightBorder(intersectionMaxY, item.x, item.height, item.width, item.id, false, intersectionSizeY);

            const checkAll = () => {
                const left = checkLeft()
                const right = checkRight()
                const up = checkUp()
                const down = checkDown()

                return {
                    left: left, up: up,
                    right: right, down: down
                }
            }

            // console.log("Check all: ", checkAll())

            const getPreferredDirection = () => {
                const checks = checkAll()

                if (Math.abs(xDiff) > Math.abs(yDiff)) {
                    if (xDiff > 0) {
                        if (checks.left)
                            return { x: -intersectionSizeX, y: 0 } // left
                        else if (checks.right)
                            return { x: intersectionSizeX, y: 0 } // right
                    } else {
                        if (checks.right)
                            return { x: intersectionSizeX, y: 0 } // right
                        else if (checks.left)
                            return { x: -intersectionSizeX, y: 0 } // left
                    }
                }

                // check horizontal
                if (yDiff > 0) {
                    if (checks.up)
                        return { x: 0, y: -intersectionSizeY } // up
                    else if (checks.down)
                        return { x: 0, y: intersectionSizeY } // down
                } else {
                    if (checks.down)
                        return { x: 0, y: intersectionSizeY } // down
                    else if (checks.up)
                        return { x: 0, y: -intersectionSizeY } // up
                }
            }

            setTempItems(oldTempItems => {
                const dir = getPreferredDirection()
                const newItem = {
                    ...item,
                    x: item.x + dir.x,
                    y: item.y + dir.y
                }
                return [
                    ...oldTempItems.filter(i => i.id !== item.id && blockingItemsTemp.some(b => b.id === i.id)),
                    newItem
                ]
            })
            // console.log("Preferred direction: ", getPreferredDirection(xDiff, yDiff))
            // console.log(checkLeft())


            // halt wenn abs(xDiff) > abs(yDiff)
            // um width verschieben

            // let solution = null

            // while (!solution) {
            //     if (Math.abs(xDiff) > Math.abs(yDiff)) {// check if to move right or left
            //         if (xDiff > 0) {
            //             // if move left: check if > 0 & placementGrid[x-1][y] is empty
            //             const isFree = checkIfSpaceIsFree(itemX, itemY)
            //             if (isFree) {
            //                 solution = { x: itemX, y: itemY }
            //             }

            //             console.log("Move left")
            //         } else {
            //             // if move right: check if < GRID_COLUMNS & placementGrid[x+width][y] is empty
            //             console.log("Move right")
            //         }
            //     } else {// check if to move up or down
            //         if (yDiff > 0) {
            //             // if move up: check if > 0 & placementGrid[x][y-1] is empty
            //             console.log("Move up")
            //         } else {
            //             // if move down: check if < GRID_ROWS & placementGrid[x][y+height] is empty
            //             console.log("Move down")
            //         }
            //     }
            // }

            // console.log("Item momved: ", movedItem.id, "Item blocking: ", item.id, "xDiff: ", xDiff, "yDiff: ", yDiff)
        }
    }

    return (
        <View style={styles.container}>
            <View
                style={{ height: 50, marginTop: -100, justifyContent: 'flex-start' }}
            >
                <IconButton iconName='save' text='Save' />
            </View>

            {items.filter(item => !tempItems.some(other => other.id === item.id)).map((item) => (
                <Item
                    key={item.id}
                    id={item.id}
                    x={item.x * GRID_UNIT}
                    y={item.y * GRID_UNIT}
                    width={item.width * GRID_UNIT}
                    height={item.height * GRID_UNIT}
                    handleDragEnd={handleDragEnd}
                    snapToNearestGridPoint={snapPxToGridAsPx}
                    makeSpaceForItem={makeSpaceForItem}
                />
            ))}

            {tempItems.map((item) => (

                <Item
                    key={item.id}
                    id={item.id}
                    x={item.x * GRID_UNIT}
                    y={item.y * GRID_UNIT}
                    width={item.width * GRID_UNIT}
                    height={item.height * GRID_UNIT}
                    isShaking={true}
                    handleDragEnd={handleDragEnd}
                    snapToNearestGridPoint={snapPxToGridAsPx}
                    makeSpaceForItem={makeSpaceForItem}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#f2f2f2',
    }
});