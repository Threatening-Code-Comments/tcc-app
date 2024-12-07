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

    const makeSpaceForItem = (movedItem: PixelTile & { id: number }, contactPoint: PixelPoint) => {
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

            const xDiff = ((contactPoint.x < itemX) ? 1 : -1) * Math.abs(contactPoint.x - itemX);
            const yDiff = ((contactPoint.y < itemY) ? -1 : 1) * Math.abs(contactPoint.y - itemY);

            const intersectingPoints = itemPoints.filter(p => movedItemPoints.some(p2 => PlacementGrid.isSamePoint(p, p2)))
            const intersectionSizeX = new Set(intersectingPoints.map(p => p.x)).size
            const intersectionSizeY = new Set(intersectingPoints.map(p => p.y)).size

            const intersectionMinX = itemPoints.reduce((prev, cur) => Math.min(prev, cur.x), Number.MAX_VALUE)
            const intersectionMinY = itemPoints.reduce((prev, cur) => Math.min(prev, cur.y), Number.MAX_VALUE)

            const checkLeft = () => movedPlacementGrid.checkLeftBorder(intersectionMinX, item.y, item.width, item.height, item.id, true, intersectionSizeX);
            const checkUp = () => movedPlacementGrid.checkLeftBorder(intersectionMinY, item.x, item.height, item.width, item.id, false, intersectionSizeY);
            const checkRight = () => movedPlacementGrid.checkRightBorder(intersectionMinX, item.y, item.width, item.height, item.id, true, intersectionSizeX);
            const checkDown = () => movedPlacementGrid.checkRightBorder(intersectionMinY, item.x, item.height, item.width, item.id, false, intersectionSizeY);

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

            const getPreferredDirection = () => {
                const checks = checkAll()

                const checkHorizontal = (tryPrimary: boolean) => {
                    const primary = xDiff > 0 ? checks.right : checks.left
                    const secondary = xDiff > 0 ? checks.left : checks.right

                    if (tryPrimary && primary) {
                        const sign = xDiff > 0 ? 1 : -1

                        return { x: sign * intersectionSizeX, y: 0 }
                    } else if (secondary) {
                        const sign = xDiff > 0 ? -1 : 1

                        return { x: sign * intersectionSizeX, y: 0 }
                    }
                }

                const checkVertical = (tryPrimary: boolean) => {
                    const primary = yDiff > 0 ? checks.up : checks.down
                    const secondary = yDiff > 0 ? checks.down : checks.up

                    if (tryPrimary && primary) {
                        const sign = yDiff > 0 ? -1 : 1
                        console.log({ sign, intersectionSizeY })

                        return { x: 0, y: sign * intersectionSizeY }
                    } else if (secondary) {
                        const sign = yDiff > 0 ? 1 : -1

                        return { x: 0, y: sign * intersectionSizeY }
                    }
                }

                if (Math.abs(xDiff) > Math.abs(yDiff)) {
                    const horizontal = checkHorizontal(true)
                    if (horizontal) return horizontal
                } else {
                    const vertical = checkVertical(true)
                    if (vertical) return vertical
                }

                const horizontal = checkHorizontal(false)
                if (horizontal) return horizontal

                const vertical = checkVertical(false)
                if (vertical) return vertical

                console.error("No direction found (getPreferredDirection)")
                return { x: 0, y: 0 }
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