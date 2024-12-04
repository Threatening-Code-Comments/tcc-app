import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { IconButton } from '../IconButton';
import Item from './item'; // Einzelnes Item, das vom Handler gesteuert wird
import { ValueOf } from 'react-native-gesture-handler/lib/typescript/typeUtils';

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

const isSamePoint = (point1, point2) => point1.x === point2.x && point1.y === point2.y
const getCoordinateDiff = (movedItemCoordinate: number, blockingItemCoordinate: number, blockingItemSize: number) => {
    const diff1 = movedItemCoordinate - blockingItemCoordinate
    const diff2 = movedItemCoordinate - blockingItemCoordinate + blockingItemSize
    return Math.abs(diff1) < Math.abs(diff2) ? diff1 : diff2
}

type GridPlacementList = { x: number, y: number, item: HomescreenItem }[]
type Point = {
    x: number;
    y: number;
};

export type HomescreenItem = {
    id: number
    x: number
    y: number
    width: number
    height: number
}
export const HomeScreenHandler = (props: { items: HomescreenItem[] }) => {
    const [items, setItems] = useState(props.items);
    const [placementGrid, setPlacementGrid] = useState<GridPlacementList>([])

    const addToGridIfPossible = (item: HomescreenItem, grid: GridPlacementList, point: Point) => {
        const valueFromList = grid.find((pointFromGrid) => pointFromGrid.x === point.x && pointFromGrid.y === point.y)
        if (valueFromList) {
            valueFromList.item = item
        } else {
            grid.push({ x: point.x, y: point.y, item: item })
        }
    }
    useEffect(() => {
        setPlacementGrid(() => {
            const grid: GridPlacementList = []

            items.forEach((item) => {
                const addCoordinate = addToGridIfPossible.bind(null, item, grid)
                for (let i = item.x; i < item.x + item.width; i++) {
                    for (let j = item.y; j < item.y + item.height; j++) {
                        addCoordinate({ x: i, y: j })
                    }
                }
            })

            return grid
        })
    }, [items])

    const handleDragEnd = (id: number, newX: number, newY: number) => {
        const newPosition = { x: pxToGrid(newX), y: pxToGrid(newY) };

        setItems((prevItems) => prevItems.map((item) => {
            if (item.id === id) {
                const updatedItem = { ...item, ...newPosition };
                return updatedItem;
            }
            return item;
        }))
    };

    const makeSpaceForItem = (movedItem: { id: number, x: number, y: number, width: number, height: number }) => {
        const movedItemToCoordinate = { x: pxToGrid(movedItem.x), y: pxToGrid(movedItem.y) }

        const movedOriginOnGrid = { x: pxToGrid(movedItem.x), y: pxToGrid(movedItem.y) }
        const pointsOnGrid = [{ x: movedOriginOnGrid.x, y: movedOriginOnGrid.y }]
        for (let i = movedOriginOnGrid.x; i < movedOriginOnGrid.x + pxToGrid(movedItem.width); i++) {
            for (let j = movedOriginOnGrid.y; j < movedOriginOnGrid.y + pxToGrid(movedItem.height); j++) {
                pointsOnGrid.push({ x: i, y: j })
            }
        }

        const blockingItemsTemp = placementGrid
            .filter((point) =>
                isSamePoint(point, movedOriginOnGrid) ||
                pointsOnGrid.some((pointOnGrid) => isSamePoint(point, pointOnGrid))
            )
            .flatMap((point) => point.item)
            .filter((item) => item.id !== movedItem.id)

        // console.log("Blocking Items: ", blockingItemsTemp.map((item) => ({ _id: item.id, ...item })))
        const checkIfSpaceIsFree = (x: number, y: number, itemIdToExclude?: number) => {
            if (x < 0 || y < 0 || x >= GRID_COLUMNS || y >= GRID_ROWS) return false

            const point = placementGrid.find((point) => point.x === x && point.y === y)
            return !point || !point?.item || (point.item.id === movedItem.id || point.item.id === itemIdToExclude)
        }

        for (let item of blockingItemsTemp) {
            const itemX = gridToPx(item.x)
            const itemY = gridToPx(item.y)
            const itemWidth = gridToPx(item.width)
            const itemHeight = gridToPx(item.height)

            const xDiff = getCoordinateDiff(movedItem.x, itemX, itemWidth)  //movedItem.x - gridToPx(item.x)
            const yDiff = getCoordinateDiff(movedItem.y, itemY, itemHeight)  //movedItem.y - gridToPx(item.y)

            const checkLeftBorder = (variableCoordinate: number, fixedCoordinate: number, size: number, crossSize: number, itemId: number,
                vIsX: boolean,
                offset: number,) => {
                const startMain = variableCoordinate - (size - 1)
                const startCross = Math.max(fixedCoordinate + (crossSize - 1), fixedCoordinate - (crossSize - 1))

                let isFree = false
                for (let i = 1; i <= offset; i++) {
                    for (let crossCoordinate = startCross; crossCoordinate <= fixedCoordinate; crossCoordinate++) {
                        for (let mainCoordinate = startMain - i; mainCoordinate < variableCoordinate - i; mainCoordinate++) {
                            isFree = (vIsX)
                                ? checkIfSpaceIsFree(mainCoordinate, crossCoordinate, itemId)
                                : checkIfSpaceIsFree(crossCoordinate, mainCoordinate, itemId)

                            if (!isFree) return false
                        }
                    }
                }
                return isFree
            }
            const checkRightBorder = (variableCoordinate: number, fixedCoordinate: number, size: number, crossSize: number, itemId: number,
                vIsX: boolean,
                offset: number,
            ) => {
                let isFree = false
                for (let i = 1; i <= offset; i++) {
                    for (let crossCoordinate = fixedCoordinate; crossCoordinate < fixedCoordinate + crossSize; crossCoordinate++) {
                        for (let mainCoordinate = variableCoordinate + i; mainCoordinate < variableCoordinate + i + size; mainCoordinate++) {
                            isFree = (vIsX)
                                ? checkIfSpaceIsFree(mainCoordinate, crossCoordinate, itemId)
                                : checkIfSpaceIsFree(crossCoordinate, mainCoordinate, itemId)

                            if (!isFree) return false
                        }
                    }
                }
                return isFree
            }
            const movedItemWidthG = pxToGrid(movedItem.width)
            const movedItemHeightG = pxToGrid(movedItem.height)


            const xCoordinate = movedItemToCoordinate.x //item.x
            const yCoordinate = movedItemToCoordinate.y //itemy
            const checkLeft = () => checkLeftBorder(xCoordinate, item.y, item.width, item.height, item.id, true, movedItemWidthG);
            const checkUp = () => checkLeftBorder(yCoordinate, item.x, item.height, item.width, item.id, false, movedItemHeightG);
            const checkRight = () => checkRightBorder(xCoordinate, item.y, item.width, item.height, item.id, true, movedItemWidthG,);
            const checkDown = () => checkRightBorder(yCoordinate, item.x, item.height, item.width, item.id, false, movedItemHeightG);

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

            // const getPreferredDirection = (xDiff, yDiff) => {
            //     if (Math.abs(xDiff) > Math.abs(yDiff)) {
            //         if (xDiff > 0) {
            //             return checkAll().left ? "left" : "right"
            //         } else {
            //             return checkAll().right ? "right" : "left"
            //         }
            //     } else {
            //         if (yDiff > 0) {
            //             return checkAll().up ? "up" : "down"
            //         } else {
            //             return checkAll().down ? "down" : "up"
            //         }
            //     }
            // }

            console.log(checkAll())
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

            {items.map((item) => (
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