import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from '../IconButton';
import Item from './item'; // Einzelnes Item, das vom Handler gesteuert wird
import { GRID_COLUMNS, GRID_ROWS, GRID_UNIT, gridToPx, makeSpaceForItem, pixelToGrid, pxToGrid, snapPxToGridAsPx } from './move_algo';
import { PlacementGrid } from './placementGrid';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { HomescreenItem, GridPlacementList, GridPoint, PixelPoint } from './types';

// Basierend auf Bildschirmgröße

const DEBUG_DELAY = 300 //null

export const HomeScreenHandler = (props: { items: HomescreenItem[] }) => {
    const [items, setItems] = useState(props.items);
    const [tempItems, setTempItems] = useState<HomescreenItem[]>([])
    const [previewItem, setPreviewItem] = useState<HomescreenItem | null>(null)
    const [placementGrid, setPlacementGrid] = useState<GridPlacementList>(new PlacementGrid(GRID_COLUMNS, GRID_ROWS))
    const folderCreateItem = useSharedValue<HomescreenItem | null>(null)
    const updateTimeout = useSharedValue<NodeJS.Timeout | null>(null);
    const lastCheckedCoordinate = useSharedValue<GridPoint>({ x: 0, y: 0 });

    useEffect(() => {
        setPlacementGrid(() => {
            const grid = new PlacementGrid(GRID_COLUMNS, GRID_ROWS)
            items.forEach((item) => grid.addItem(item))
            return grid
        })
    }, [items])

    useEffect(() => {
        // console.log(previewItem && [previewItem.x, previewItem.y])
    }, [previewItem])

    const updatePreviewItem = (item: HomescreenItem, delayed = false) => {
        setPreviewItem(item)
    }

    const handleDragUpdate = (item: HomescreenItem, pixel: PixelPoint) => {
        const coordinate = {
            x: snapPxToGridAsPx(item.x),
            y: snapPxToGridAsPx(item.y)
        };

        if (coordinate.x === lastCheckedCoordinate.value.x && coordinate.y === lastCheckedCoordinate.value.y) {
            return;
        }

        lastCheckedCoordinate.value = coordinate;
        setTimeout(() => {
            lastCheckedCoordinate.value = { x: -1, y: -1 }
        }, 10)


        // console.log('handleDragUpdate', item, pixel)
        // runOnJS(updatePreviewItem)({ ...item, ...pixelToGrid(coordinate), width: pxToGrid(item.width), height: pxToGrid(item.height) })
        updatePreviewItem({ ...item, ...pixelToGrid(coordinate), width: pxToGrid(item.width), height: pxToGrid(item.height) })
        //  runOnJS(makeSpaceForItem)(item, point);                                                                                          
        makeSpaceForItem2(item, pixel)
    }

    const handleDragEnd = (id: number, pixel: PixelPoint) => {
        const newPosition = pixelToGrid(pixel);
        folderCreateItem.value = null

        setItems((prevItems) => prevItems.map((item) => {
            const tempItem = tempItems.find(i => i.id === item.id)

            if (item.id === id) {
                const updatedItem = { ...item, ...newPosition };
                return updatedItem;
            }

            return !!tempItem ? tempItem : item;
        }))

        setTempItems([])
        setPreviewItem(null)
    };

    const makeSpaceForItem2 = (item: HomescreenItem, contactPoint: PixelPoint) => {
        const newTempItems = makeSpaceForItem(item, contactPoint, placementGrid)
        setTempItems([])

        const folderIcon = newTempItems[0] ?? null
        const folderCoordinate = { x: gridToPx(folderIcon?.x ?? -1), y: gridToPx(folderIcon?.y ?? -1) }

        const threshold = 100
        const diffX = Math.abs(contactPoint.x) - Math.abs(folderCoordinate.x)
        const diffY = Math.abs(contactPoint.y) - Math.abs(folderCoordinate.y)

        // if(item.x - contactPoint.x < threshold && item.y - contactPoint.y < threshold){
        //     console.log('distance low')
        // }else{
        //     console.log('distance high')
        // }
        // console.log('makeSpace', diffX, diffY)

        // if(!!folderIcon){
        //     console.log('xDiff:', item.x - contactPoint.x, 'yDiff:', item.y - contactPoint.y)
        // }
        folderCreateItem.value = null
        folderCreateItem.value = folderIcon
        // console.log('folderIcon', folderIcon)

        if (!updateTimeout.value && newTempItems !== tempItems) {
            const afterTimeout = () => {
                // console.log('updateTimeout', newTempItems)
                runOnJS(setTempItems)(oldTempItems =>
                    newTempItems
                )

                if (!!folderCreateItem.value) {
                    updateTimeout.value = applyTimeout(afterTimeout)
                } else
                    // folderCreateItem.value = //null
                    updateTimeout.value = null
            }
            const applyTimeout = (afterTimeout: () => void) => {
                return setTimeout(afterTimeout, DEBUG_DELAY ?? 300)
            }

            const timeout = applyTimeout(afterTimeout)
            updateTimeout.value = timeout
        }
    }


    return (
        <>
            <View
                style={{ height: 50, marginTop: -100, justifyContent: 'flex-start' }}
            >
                <IconButton iconName='save' text='Save' />
            </View>

            {!previewItem
                ? null
                : <Item
                    key={'preview' + previewItem.id}
                    id={previewItem.id}
                    x={previewItem.x * GRID_UNIT}
                    y={previewItem.y * GRID_UNIT}
                    width={previewItem.width * GRID_UNIT}
                    height={previewItem.height * GRID_UNIT}
                    isShaking={false}
                    isPreview={true}
                    updatePreviewItem={(item) => { updatePreviewItem(item) }}
                    handleDragEnd={() => { }}
                    snapToNearestGridPoint={snapPxToGridAsPx}
                    makeSpaceForItem={makeSpaceForItem2}
                />
            }

            {items.filter(item => !tempItems.some(other => other.id === item.id)).map((item) => (
                <Item
                    key={item.id}
                    id={item.id}
                    x={item.x * GRID_UNIT}
                    y={item.y * GRID_UNIT}
                    width={item.width * GRID_UNIT}
                    height={item.height * GRID_UNIT}
                    updatePreviewItem={updatePreviewItem}
                    handleDragUpdate={handleDragUpdate}
                    handleDragEnd={handleDragEnd}
                    snapToNearestGridPoint={snapPxToGridAsPx}
                    makeSpaceForItem={makeSpaceForItem2}
                    onCreateFolderHover={(isHovering) => {
                        console.log('isHovering', isHovering)
                    }}
                    createFolderPreview={folderCreateItem.value?.id}
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
                    updatePreviewItem={() => { }}
                    handleDragEnd={handleDragEnd}
                    snapToNearestGridPoint={snapPxToGridAsPx}
                    makeSpaceForItem={makeSpaceForItem2}
                // isPreview={item.isPreview}
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