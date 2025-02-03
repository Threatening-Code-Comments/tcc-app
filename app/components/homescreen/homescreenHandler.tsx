import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from '../IconButton';
import Item from './item'; // Einzelnes Item, das vom Handler gesteuert wird
import { GRID_COLUMNS, GRID_ROWS, GRID_UNIT, makeSpaceForItem, pixelToGrid, snapPxToGridAsPx } from './move_algo';
import { PlacementGrid } from './placementGrid';

// Basierend auf Bildschirmgröße


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
            const tempItem = tempItems.find(i => i.id === item.id)

            if (item.id === id) {
                const updatedItem = { ...item, ...newPosition };
                return updatedItem;
            }

            return !!tempItem ? tempItem : item;
        }))

        setTempItems([])
    };

    const makeSpaceForItem2 = (item: HomescreenItem, contactPoint: PixelPoint) => setTempItems(oldTempItems =>
        makeSpaceForItem(item, contactPoint, placementGrid)
    )


    return (
        <>
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
                    makeSpaceForItem={makeSpaceForItem2}
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
                    makeSpaceForItem={makeSpaceForItem2}
                />
            ))}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        // backgroundColor: '#f2f2f2',
    }
});