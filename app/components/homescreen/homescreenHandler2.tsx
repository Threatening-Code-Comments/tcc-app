import {useRouter} from "expo-router";
import React, {ReactNode, useEffect, useState} from "react";
import {FlatList, View} from "react-native";
import {useSharedValue} from "react-native-reanimated";
import {IconButton} from "../IconButton";
import Item2 from "./item2";
import {GRID_COLUMNS, GRID_ROWS, GRID_UNIT, pixelToGrid, snapPxToGridAsPx} from "./move_algo";
import {PlacementGrid} from "./placementGrid";
import {PreviewItem} from "./previewItem";
import {GridPlacementList, GridPoint, HomescreenItem, PixelPoint} from "./types";
import {Text} from "react-native-paper";

const STD_GRID_SIZE = ({x: GRID_COLUMNS, y: GRID_ROWS})

const homescreenHandlerNew = (props: { items: HomescreenItem[] }) => {
    const [placementGrid, setPlacementGrid] = useState<GridPlacementList>(
        new PlacementGrid(GRID_COLUMNS, GRID_ROWS)
    );
    const router = useRouter();
    const [items, setItems] = useState<HomescreenItem[]>(props.items);
    const [movedItems, setMovedItems] = useState<HomescreenItem[]>([]);
    const [previewItem, setPreviewItem] = useState<HomescreenItem | null>(
        // { id: -1, x: 3, y: 3, width: 1, height: 1 })
        null);

    const lastCheckedCheckedCoordinate = useSharedValue<{
        x: number;
        y: number;
    }>({x: 0, y: 0});

    useEffect(() => {
        setItems(props.items);
    }, [props.items]);

    const isSamePoint = (p1: GridPoint, p2: GridPoint) => {
        return p1.x === p2.x && p1.y === p2.y;
    }

    const onDragUpdate = (
        item: HomescreenItem,
        pixel: { x: number; y: number }
    ) => {
        const gridCoordinate = pixelToGrid(pixel);

        if (isSamePoint(gridCoordinate, lastCheckedCheckedCoordinate.value)) {
            return;
        }

        console.log("last checked: ", lastCheckedCheckedCoordinate.value, "new: ", gridCoordinate)
        // console.log(
        //   "moved items: ",
        //   movedItems.map((mI) => mI.id)
        // )

        lastCheckedCheckedCoordinate.value = gridCoordinate;

        const newItem = {
            ...item, x: gridCoordinate.x, y: gridCoordinate.y
        };
        setPreviewItem(null)
        setPreviewItem(newItem);


        // if(lastCoordinate != currentPos){
        //     setPreviewItem(null)
        //     const itemsToMoveToPlacePreviewItem =
        //         makeSpaceforItem(...)
        //     if(itemsToMoveToPlacePreviewItem.length > 0){
        //         setTempItems(itemsToMoveToPlacePreviewItem)
        //     }
        //     setPreviewItem({...oldPreviewItem, x: currentX, y: currentY})
        // }
    };

    const onDragEnd = (id: number, pixel: PixelPoint) => {
        const newCoordinate = pixelToGrid(pixel);

        // //if folder create state exists, HHHHHHHHHH
        setPreviewItem(null);

        const newItem = {...items.findLast((i) => i.id === id), ...newCoordinate};

        const itemsCopy = items.map((i) => (i.id !== id ? i : newItem))
        // setItems([])
        setItems(itemsCopy);
    };

    const itemComponent = (
        itemList: HomescreenItem[],
        predicate: (
            value: HomescreenItem,
            index: number,
            array: HomescreenItem[]
        ) => value is HomescreenItem
    ) =>
        itemList
            .filter(predicate)
            .map((item) => (
                <Item2
                    key={item.id}
                    id={item.id}
                    x={item.x * GRID_UNIT}
                    y={item.y * GRID_UNIT}
                    width={item.width * GRID_UNIT}
                    height={item.height * GRID_UNIT}
                    updatePreviewItem={setPreviewItem}
                    onDragUpdate={onDragUpdate.bind(null, item)}
                    handleDragEnd={onDragEnd}
                    snapToNearestGridPoint={snapPxToGridAsPx}
                />
            ));

    const maxCoordinates: GridPoint =
        items.length > 0 ?
            ({
                x: Math.max(STD_GRID_SIZE.x,
                    items.reduce((prev, curr) => prev.x < curr.x ? curr : prev).x),
                y: Math.max(STD_GRID_SIZE.y,
                    items.reduce((prev, curr) => prev.y < curr.y ? curr : prev).y)
            }) : STD_GRID_SIZE
    const getFullList = (items: HomescreenItem[]) => {
        const fullList: (HomescreenItem | undefined)[] = []

        for (let y = 0; y < maxCoordinates.y; y++) {

            for (let x = 0; x < maxCoordinates.x; x++) {
                const itemToPush = items.find((i) => i.x === x && i.y === y);

                fullList.push(itemToPush);
            }

        }

        return fullList;
    }

    return (
        <>
            <View
                style={{height: 50, marginTop: -100, justifyContent: "flex-start"}}
            >
                <IconButton
                    iconName="refresh"
                    text="Refresh"
                    onPress={() => {
                        router.navigate(`/pages/0`);
                    }}
                />
            </View>

            {/*{!previewItem*/}
            {/*    ? null*/}
            {/*    : <PreviewItem*/}
            {/*        key={'preview' + previewItem.id}*/}
            {/*        id={previewItem.id}*/}
            {/*        x={previewItem.x * GRID_UNIT}*/}
            {/*        y={previewItem.y * GRID_UNIT}*/}
            {/*        width={previewItem.width * GRID_UNIT}*/}
            {/*        height={previewItem.height * GRID_UNIT}*/}
            {/*    />*/}
            {/*}*/}

            {items
                .filter((item) => !movedItems.some((mI) => mI.id === item.id))
                .map((item) => (
                    <Item2
                        key={item.id}
                        id={item.id}
                        x={item.x * GRID_UNIT}
                        y={item.y * GRID_UNIT}
                        width={item.width * GRID_UNIT}
                        height={item.height * GRID_UNIT}
                        updatePreviewItem={setPreviewItem}
                        onDragUpdate={onDragUpdate.bind(null, item)}
                        handleDragEnd={onDragEnd}
                        snapToNearestGridPoint={snapPxToGridAsPx}
                    />
                ))}

            {/*<View style={{display: 'flex', flexWrap: "wrap", width: '100%', backgroundColor: 'red', height: '100%'}}>*/}
            {/*    /!*{getFullList(items.filter((i) => !movedItems.some((i2) => i2.id === i.id)))*!/*/}
            {/*    /!*    .map((item, index) => (*!/*/}
            {/*    /!*        <Item3*!/*/}
            {/*    /!*            key={index + (!item ? "empy" : item.id + "")}*!/*/}
            {/*    /!*            item={item}*!/*/}
            {/*    /!*        />*!/*/}
            {/*    /!*    ))*!/*/}
            {/*    /!*}*!/*/}

            {/*    <Item3*/}
            {/*        item={undefined}/>*/}

            {/*</View>*/}

            {/*<View style={{}}>*/}
            {/*    <FlatList*/}
            {/*        data={items}*/}
            {/*        renderItem={({item}) => <Item3 item={item}/>}*/}
            {/*        keyExtractor={(item, index) => !!item ? index + "" + item.id : index + ""}*/}
            {/*        numColumns={maxCoordinates.x}*/}
            {/*    />*/}
            {/*</View>*/}

        </>
    );
};

type Item3Props = { item?: HomescreenItem };
const Item3 = ({item}: Item3Props) => {

    return <View style={{height: 40, width: 40, backgroundColor: 'yellow'}}><Text>Hello</Text></View>

    const Skeleton = ({children}: { children: ReactNode }) => (<View style={{
        flex: 1, aspectRatio: 1, height: 40, width: 40, backgroundColor: 'yellow'
    }}>
        {children}
    </View>)

    if (!item) return (<Skeleton>
        <View style={{backgroundColor: 'grey'}}/>
    </Skeleton>)

    return (<Skeleton>
        <View style={{backgroundColor: 'blue'}}/>
    </Skeleton>)
}

export default homescreenHandlerNew;


