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

type GridPlacementList = { x: number, y: number, items: HomescreenItem[] }[]
type Point = {
    x: number;
    y: number;
};

type HomescreenItem = {
    id: number
    x: number
    y: number
    width: number
    height: number
}
export const HomeScreenHandler = (props: { items: HomescreenItem[] }) => {
    const [items, setItems] = useState(props.items);
    const [placementGrid, setPlacementGrid] = useState<GridPlacementList>([])
    const [blockingItems, setBlockingItems] = useState<Set<number>>(new Set());

    const addToGridIfPossible = (item: HomescreenItem, grid: GridPlacementList, point: Point) => {
        const valueFromList = grid.find((pointFromGrid) => pointFromGrid.x === point.x && pointFromGrid.y === point.y)
        if (valueFromList) {
            valueFromList.items.push(item)
        } else {
            grid.push({ x: point.x, y: point.y, items: [item] })
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

    const isSamePoint = (point1, point2) => point1.x === point2.x && point1.y === point2.y

    const makeSpaceForItem = (movedItem: { id: number, x: number, y: number, width: number, height: number }) => {
        const originOnGrid = { x: pxToGrid(movedItem.x), y: pxToGrid(movedItem.y) }
        const pointsOnGrid = [originOnGrid]
        for (let i = originOnGrid.x; i < originOnGrid.x + pxToGrid(movedItem.width); i++) {
            for (let j = originOnGrid.y; j < originOnGrid.y + pxToGrid(movedItem.height); j++) {
                pointsOnGrid.push({ x: i, y: j })
            }
        }

        const blockingItemsTemp = placementGrid
            .filter((point) =>
                isSamePoint(point, originOnGrid) ||
                pointsOnGrid.some((pointOnGrid) => isSamePoint(point, pointOnGrid))
            )
            .flatMap((point) => point.items)
            .filter((item) => item.id !== movedItem.id)

        console.log("Blocking Items: ", blockingItemsTemp.map((item) => ({ _id: item.id, ...item })))
        // // console.log("placementGrid: ", placementGrid)

        // for (let item of blockingItemsTemp) {
        //     // console.log("Item: ", item)

        // }
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
                    blockingItems={blockingItems}
                    pxToGrid={pxToGrid}
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