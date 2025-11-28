import React, {useEffect, useState} from "react";
import {HS3Element, HS3Folder, HS3Item} from "@components/homescreen/3-homescreen/3_homescreenHandler";
import {getFoldersFromDb} from "@components/homescreen/top-down-homescreen/db-mock";
import {Text} from "react-native-paper";
import Animated, {
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue
} from "react-native-reanimated";
import {BackHandler, ToastAndroid, View} from "react-native";
import {Folder4, Item4} from "@components/homescreen/top-down-homescreen/item-and-folder";
import {useRouter} from "expo-router";

import {PreviewItem3} from "@components/homescreen/3-homescreen/3_previewItem";
import {PixelPoint} from "@components/homescreen/types";
import {
    addToNewFolder,
    createTempElements,
    generateItemResults,
    generateTempItems,
    getFoldersForLevel,
    getModifiedTempItems,
    getTargetLayout4,
    goUpLevel
} from "@components/homescreen/top-down-homescreen/top-down-util";
import {DragState4, HomescreenState} from "@components/homescreen/top-down-homescreen/top-down-hs-types";
import {getElementKey, isSameElement} from "@components/homescreen/3-homescreen/3_util";
import {GRID_UNIT, gridPointToPixel, gridToPx} from "@components/homescreen/move_algo";
import {FOLDER_HOVER_OVERLAY_INSET} from "@components/homescreen/3-homescreen/3_item3";
import {useItemPopup} from "@components/homescreen/top-down-homescreen/item-popup";
import {Gesture, GestureDetector} from "react-native-gesture-handler";

type Props = {}

export const HomescreenManager = (props: Props) => {
    const router = useRouter();

    //refresh
    const r = useState<boolean>(false);
    const refreshState = () => r[1](prevState => !prevState);

    //from db
    const folders = useSharedValue<HS3Folder[]>([]);
    useEffect(() => {
        getFoldersFromDb()
            .catch(err => console.log(err))
            .then(
                res => {
                    if (!!res)
                        folders.value = res
                }
            )
    }, []);

    //root level / level management
    const currentLevel = useSharedValue<number | undefined>(undefined)
    const currentFolderLevel = useDerivedValue(() => {
        return getFoldersForLevel(folders.value, currentLevel.value)
    }, [folders, currentLevel])
    const visibleElements = useDerivedValue<HS3Element[]>(() => {
        if (!currentFolderLevel.value.main) return []
        console.log("update!")
        let newVar = [
            ...currentFolderLevel.value.main.items,
            ...currentFolderLevel.value.more
        ];
        return newVar
    }, [currentFolderLevel])

    //drag state
    const dragState = useSharedValue<DragState4 | undefined>(undefined);
    //drag state

    //dragState
    // ->preview item
    const previewElement = useDerivedValue<HS3Element>(() => {
        if (!dragState.value) {
            return undefined
        }

        return getTargetLayout4(dragState.value)
    }, [dragState])

    //dragState, currentFolderLevel, previewElement
    // ->item results
    const itemResults = useDerivedValue(() => {
        return generateItemResults(dragState.value, previewElement.value, visibleElements.value);
    }, [dragState, currentFolderLevel, previewElement])

    //itemResults
    //->isAddFolder
    const isAddFolder = useDerivedValue(() => {
        if (!itemResults.value) return undefined

        for (let result of itemResults.value) {
            const {element, dirs: {isAddFolder: isAddFolderR}} = result
            if (isAddFolderR) return element
        }
        return undefined
    }, [itemResults])

    //itemResults, previewElement, visibleElements
    //->TEMP ITEMS
    const tempItems = useDerivedValue(() => {
        return createTempElements(itemResults.value, previewElement.value, visibleElements.value, isAddFolder.value)
    }, [itemResults, previewElement, visibleElements, isAddFolder])

    //tempItems, visibleElements
    //->tempItemsImpossible
    const tempItemsImpossible = useDerivedValue(
        () => generateTempItems(tempItems.value, visibleElements.value, dragState.value),
        [tempItems, visibleElements, dragState])

    //----------- homescreen state
    const homescreenState = useSharedValue<HomescreenState>("default")

    type RunnablesForElements<T> = {
        onDragStart: (e: T) => void
        onDragUpdate: (e: T, coordinate: PixelPoint) => void,
        onDragEnd: (e: T) => void,
        onTap: (e: T) => void
        onLongTap: (e: T, coordinate: PixelPoint) => void,
    }
    const folderRunnables: RunnablesForElements<HS3Folder> = {
        onDragStart: (f) => onDragStart(f),
        onDragUpdate: (f, coordinate) => onDragUpdate(f, coordinate),
        onDragEnd: (f) => onDragEnd(f),
        onTap: (f) => onFolderTap(f),
        onLongTap: (f, c) => onLongTap(f, c)
    }
    const itemRunnables: RunnablesForElements<HS3Item> = {
        onDragStart: (f) => onDragStart(f),
        onDragUpdate: (f, coordinate) => onDragUpdate(f, coordinate),
        onDragEnd: (f) => onDragEnd(f),
        onTap: (f) => console.log("ITEM HAS BEEN TUOCHED", f.itemId),
        onLongTap: (f, c) => onLongTap(f, c)
    }


    // native back button handling
    useEffect(() => {
        const backAction = () => {
            goUpLevel(currentLevel, folders)
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, []);

    //---------Drag Events------------
    const onDragStart = (element: HS3Element) => {

    };
    const onDragUpdate = (element: HS3Element, coordinate: PixelPoint) => {
        dragState.value = {
            element, coordinate
        }
    };

    const onDragEnd = (element: HS3Element) => {
        const isImpossible = tempItemsImpossible.value.length > 0
        const modifiedElement: HS3Element =
            {...previewElement.value, layout: {...previewElement.value.layout}}
        const elementsToModify: HS3Element[] = [...tempItems.value, modifiedElement]
        if (isImpossible) {
            dragState.value = undefined
            ToastAndroid.show("Couldn't drop", ToastAndroid.SHORT);
            return
        }

        if (!!isAddFolder.value) {
            console.log("adding folder:", modifiedElement, isAddFolder.value)
            folders.value = addToNewFolder(
                modifiedElement,
                {...isAddFolder.value, layout: isAddFolder.value.layout},
                folders.value,
                currentLevel.value
            )
            dragState.value = undefined
            return
        }

        dragState.value = undefined
        folders.value = getModifiedTempItems(
            elementsToModify,
            folders.value
        )
        // runOnJS(refreshState)();
    };
    //---------Drag Events------------

    ////---------Tile / Folder Events------------
    const onFolderTap = (folder: HS3Folder) => {
        currentLevel.value = folder.folderId
    }
    ////---------Tile / Folder Events------------
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

    const createFolderPopoverStyle = useAnimatedStyle(() => ({
        backgroundColor: (!!isAddFolder.value) ? 'white' : 'transparent',
        elevation: (!!isAddFolder.value) ? 2 : 0,
        borderRadius: 5,
        width: 80, height: 45,
        position: 'absolute',
        top: -50 + ((isAddFolder.value?.layout.y * GRID_UNIT) || 0),
        left: (GRID_UNIT - 80) / 2 + ((isAddFolder.value?.layout.x * GRID_UNIT) || 0) + (
            ((isAddFolder.value?.layout.width || 0) > 1)
                ? isAddFolder.value.layout.width / 4 * GRID_UNIT
                : 0
        ),
        shadowColor: 'black',
        zIndex: 20
    }), [isAddFolder])

    const onLongTap = (e: HS3Element, coordinate: PixelPoint) => {
        // contextMenuCoordinates.value = {
        //     element: e,
        //     coordinate,
        // }
        console.log('onLongTap', e)
        if ("itemId" in e)
            popupItem.value = e
    }
    const popupItem = useSharedValue<HS3Item | undefined>(undefined)
    const {
        visible: itemPopupOpen,
        setVisible: setItemPopupOpen,
        component: itemPopupComponent
    } = useItemPopup({item: popupItem.value, folders: folders.value})
    useAnimatedReaction(
        () => ({item: popupItem.value}),
        (curr, prev) => {
            if (JSON.stringify(curr) !== JSON.stringify(prev)) {
                runOnJS(setItemPopupOpen)(!!(curr.item))
            }
        }, [popupItem]
    )


    //🔁state refreshing
    useAnimatedReaction(
        () => ({
            cV: currentLevel.value,
            // dF: JSON.stringify(currentFolderLevel.value),
            previewItem: previewElement.value,
            tempItems: JSON.stringify(tempItems.value),
            tempItemsImpossible: JSON.stringify(tempItemsImpossible.value),
            visibleElements: JSON.stringify(visibleElements.value),
            itemPopup: popupItem.value,
            homescreenState: homescreenState.value,
        }),
        (current, previous) => {
            if (JSON.stringify(current) !== JSON.stringify(previous)) {
                console.log(current.itemPopup)
                runOnJS(refreshState)();
            }
        }, [currentLevel, previewElement, tempItems, tempItemsImpossible, visibleElements, popupItem, homescreenState]
    )
    //🔁

    const longTap = Gesture.LongPress()
        .onStart(() => {
            console.log('onStart')
            homescreenState.value =
                (homescreenState.value === "default")
                    ? "edit"
                    : "default"
        })

    const editBackgroundStyle = useAnimatedStyle(() => ({
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor:
            (homescreenState.value === "default")
                ? 'transparent'
                : '#ff00ff55',
        zIndex: 1
    }), [homescreenState]);


    //<Loading
    if (!currentFolderLevel.value.main) {
        return (
            <View>
                <Text variant={"headlineMedium"} style={{color: 'black'}}>Loading...</Text>
            </View>
        )
    }

    //<Main
    return <>
        <GestureDetector gesture={longTap}>
            <Animated.View style={editBackgroundStyle}/>
        </GestureDetector>

        {!isAddFolder.value && (<PreviewItem3
            element={previewElement.value}
            impossible={false}
            isDragElement={true}
        />)}
        <Animated.View style={folderOverlayStyle}/>
        <Animated.View style={createFolderPopoverStyle}/>

        {itemPopupComponent}

        {tempItems.value.map(i => (
            <PreviewItem3
                key={getElementKey(i)}
                element={i}
                impossible={tempItemsImpossible.value.some(i2 => isSameElement(i, i2))}
            />
        ))}

        {visibleElements.value
            .filter(e => !tempItems.value.some(e2 => isSameElement(e, e2)))
            .map((e, index) =>
                ("itemId" in e)
                    ? <Item4 key={currentLevel.value + "t" + e.itemId} item={e}
                             onDragStart={() => itemRunnables.onDragStart(e)}
                             onDragUpdate={(coordinate) => itemRunnables.onDragUpdate(e, coordinate)}
                             onDragEnd={() => itemRunnables.onDragEnd(e)}
                             onTap={() => itemRunnables.onTap(e)}
                             onLongPress={(coordinate) => itemRunnables.onLongTap(e, coordinate)}
                             isEditMode={homescreenState.value === "edit"}
                    />
                    : <Folder4 key={currentLevel.value + "f" + e.folderId} folder={e}
                               onDragStart={() => folderRunnables.onDragStart(e)}
                               onDragUpdate={(coordinate) => folderRunnables.onDragUpdate(e, coordinate)}
                               onDragEnd={() => folderRunnables.onDragEnd(e)}
                               onTap={() => folderRunnables.onTap(e)}
                               onLongPress={(coordinate) => folderRunnables.onLongTap(e, coordinate)}
                               isEditMode={homescreenState.value === "edit"}
                    />
            )

        }

        {/*{currentFolderLevel.value.main.items*/}
        {/*    .filter(element => !tempItems.value.some(e => isSameElement(element, e)))*/}
        {/*    .map((item, index) =>*/}
        {/*        <Item4 key={"t" + item.itemId} item={item}*/}
        {/*               onDragStart={() => onDragStart(item)}*/}
        {/*               onDragUpdate={(coordinate) => onDragUpdate(item, coordinate)}*/}
        {/*               onDragEnd={() => onDragEnd(item)}*/}
        {/*        />*/}
        {/*    )*/}
        {/*}*/}
        {/*{currentFolderLevel.value.more*/}
        {/*    .filter(element => !tempItems.value.some(e => isSameElement(element, e)))*/}
        {/*    .map((folder, index) =>*/}
        {/*        <Folder4 key={"f" + folder.folderId} folder={folder}*/}
        {/*                 onDragStart={() => onDragStart(folder)}*/}
        {/*                 onDragUpdate={(coordinate) => onDragUpdate(folder, coordinate)}*/}
        {/*                 onDragEnd={() => onDragEnd(folder)}*/}
        {/*                 onTap={() => onFolderTap(folder)}*/}
        {/*        />)*/}
        {/*}*/}
    </>
}

/*

        <Text style={{color: 'black'}}>{JSON.stringify(visibleElements.value.map(
                e =>
                    ("folderId" in e)
                        ? {folderId: e.folderId, items: e.items.map(i => i.itemId)}
                        : {itemId: e.itemId, x: e.layout.x, y: e.layout.y}
            ).reduce(
                (p, c) => {
                    if ("folderId" in c) {
                        p.folders.push(c)
                    } else {
                        p.items.push(c)
                    }
                    return p
                },
                {items: [], folders: []}
            )
            // , null, 2
        )}</Text>



        <IconButton
            iconName="arrowUp"
            text={"Go up one level" + currentLevel.value + " " + r[0]}
            disabled={currentLevel.value === undefined}
            onPress={() => {
                goUpLevel(currentLevel, folders)
            }}
        />
        <IconButton
            iconName="refresh"
            text={"Refresh"}
            onPress={() => {
                router.push("/routines/1");
            }}/>
 */