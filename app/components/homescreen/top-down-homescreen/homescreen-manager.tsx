import React, {useEffect, useState} from "react";
import {HS3Element, HS3Folder, HS3Item} from './../types'
import {getFoldersFromDb} from "@components/homescreen/top-down-homescreen/db-mock";
import {FAB, Text} from "react-native-paper";
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

import {PreviewItem3} from "@homescreen/top-down-homescreen/3_previewItem";
import {GridValue, PixelPoint} from "@components/homescreen/types";
import {
    createTempElements,
    generateItemResults,
    generateTempItems,
    getElementKey,
    getFoldersForLevel,
    getModifiedTempItems,
    getTargetLayout4,
    goUpLevel,
    isSameElement
} from "@components/homescreen/top-down-homescreen/top-down-util";
import {DragState4, HomescreenState} from "@components/homescreen/top-down-homescreen/model-and-crud/top-down-hs-types";
import {gridPointToPixel, gridToPx} from "@components/homescreen/move_algo";
import {useItemPopup} from "@components/homescreen/top-down-homescreen/item-popup";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {FolderOperations, FolderPopover} from "@components/homescreen/top-down-homescreen/folder-popover";
import {DragPointPosition} from "@components/homescreen/top-down-homescreen/drag-point";
import {useCreateTilePopup} from "@components/homescreen/top-down-homescreen/useCreateTileOrFolderPopup";
import {moveElementsToFolder} from "@components/homescreen/top-down-homescreen/model-and-crud/move_elements";
import {addToNewFolder} from "./model-and-crud/createTileOrFolder";
import {FOLDER_HOVER_OVERLAY_INSET} from "@components/homescreen/constants";

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
        return [
            ...currentFolderLevel.value.main.items,
            ...currentFolderLevel.value.more
        ]
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
        if (dragState.value.type == 'drag')
            return getTargetLayout4(dragState.value)
        else
            return dragState.value.element
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
    const homescreenState = useSharedValue<HomescreenState>("edit")//"default")

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
            element, coordinate, type: 'drag'
        }
    };

    const folderOperation = useSharedValue<FolderOperations | undefined>(undefined)
    const onFolderPopoverChange = (op?: FolderOperations) => {
        folderOperation.value = op
    }
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
            const isCreateFolder = "itemId" in isAddFolder.value ||
                (!!folderOperation.value && folderOperation.value === "create")

            if (isCreateFolder) {
                console.log("adding folder:", modifiedElement, isAddFolder.value)
                folders.value = addToNewFolder(
                    modifiedElement,
                    {...isAddFolder.value, layout: isAddFolder.value.layout},
                    folders.value,
                    currentLevel.value
                )
            } else {
                ToastAndroid.show("moving / creating will happen with the buttons" + getElementKey(modifiedElement), ToastAndroid.SHORT)
                const newe = moveElementsToFolder(
                    [modifiedElement],
                    folders.value,
                    isAddFolder.value
                )
                folders.value = newe
                console.log("after updating folders:", JSON.stringify(newe.map(f => ({
                    fId: f.folderId, parent: f.parentId, items: f.items.map(
                        i => ({iId: i.itemId, parent: i.parentId})
                    )
                }))))
            }
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
    const onResizeUpdate = (element: HS3Element, position: DragPointPosition, deltaX: GridValue, deltaY: GridValue) => {
        const {layout} = element
        //         width: itemWidth.value * (isDragging ? n : 1) + resizeRight.value - resizeLeft.value,
        //         height: itemHeight.value * (isDragging ? n : 1) + resizeBottom.value - resizeTop.value,
        //         left: itemX.value + resizeLeft.value,
        //         top: itemY.value + resizeTop.value,
        let newLayout = {}
        switch (position) {
            case "left": {
                newLayout = {
                    x: layout.x + deltaX,
                    width: layout.width - deltaX,
                }
                break
            }
            case "top": {
                newLayout = {
                    y: layout.y + deltaY,
                    height: layout.height - deltaY,
                }
                break
            }
            case "bottom": {
                newLayout = {
                    height: layout.height + deltaY,
                }
                break
            }
            case "right": {
                newLayout = {
                    width: layout.width + (deltaX),
                }
                break
            }
        }

        const modifiedElement: HS3Element = {
            ...element,
            layout: {
                ...layout,
                ...newLayout
            }
        }

        dragState.value = {
            element: modifiedElement, coordinate: {x: 0, y: 0}, type: "resize"
        }
    }
    const onResizeEnd = (element: HS3Element, pos: DragPointPosition) => {
        const modifiedElement = dragState.value.element

        if ("itemId" in modifiedElement) {
            folders.value = folders.value.map(f =>
                f.folderId === modifiedElement.parentId
                    ? {
                        ...f, items: f.items.map(i =>
                            i.itemId === modifiedElement.itemId
                                ? modifiedElement
                                : i
                        )
                    }
                    : f
            )
        } else {
            folders.value = folders.value.map(f =>
                f.folderId === modifiedElement.folderId
                    ? modifiedElement
                    : f
            )
        }


        dragState.value = undefined
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
    //infrequent updates
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
                runOnJS(refreshState)();
                return
            }
        }, [currentLevel, previewElement, tempItems, tempItemsImpossible, visibleElements, popupItem, homescreenState]
    )
    // !!!!!very frequent updates!!!!
    const RESOLUTION = 10 //pixels
    useAnimatedReaction(
        () => ({
            cursorX: Math.floor(dragState.value?.coordinate?.x / RESOLUTION),
            cursorY: Math.floor(dragState.value?.coordinate?.y / RESOLUTION),
        }),
        (prepared, previous) => {
            if (!isAddFolder.value)
                return //this level of accuracy is only needed when there is no bigger movement

            if (JSON.stringify(prepared) !== JSON.stringify(previous)) {
                runOnJS(refreshState)();
            }
        }, [isAddFolder, dragState]
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

    const showCreateFABs = useSharedValue<boolean>(undefined)
    useAnimatedReaction(() => showCreateFABs.value,
        (c, p) => {
            if (c != p)
                runOnJS(refreshState)()
        }, [showCreateFABs])
    // const createTilePopup = useMo
    const tileCreatePopup = useCreateTilePopup({folders: folders.value, currentLevel: currentLevel.value})


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
        {/*TODO popover*/}
        <FolderPopover isAddFolder={isAddFolder.value} dragState={dragState.value}
                       onOperationChange={(op) => onFolderPopoverChange(op)}/>

        {itemPopupComponent}

        {tempItems.value.map(i => (
            <PreviewItem3
                key={getElementKey(i)}
                element={i}
                impossible={tempItemsImpossible.value.some(i2 => isSameElement(i, i2))}
            />
        ))}

        {tileCreatePopup.component}
        <FAB style={{
            position: "absolute",
            right: 20, bottom: 150,
            zIndex: 100,
        }} size={"medium"}
             icon={!!showCreateFABs.value ?
                 "window-close" : "plus"}

             label={!!showCreateFABs.value ?
                 "Cancel" : ""}
             variant={!!showCreateFABs.value ?
                 "tertiary" : "primary"}


             onPress={() => {
                 showCreateFABs.value = (!showCreateFABs.value)
             }}
        />

        {!!showCreateFABs.value
            ? <View style={{
                position: 'absolute',
                bottom: 230, right: 25,
                width: "100%",
                display: "flex", flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10, zIndex: 100
            }}>
                <FAB icon={"rectangle"}
                     variant={"secondary"}
                     label={"Tile"}
                     style={{zIndex: 100}}
                     onPress={() => tileCreatePopup.setVisible(true)}
                />

                <FAB icon={"folder"}
                     variant={"secondary"}
                     label={"Folder"}
                     style={{zIndex: 100}}
                />
            </View>
            : null}

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
                             onResizeUpdate={(pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY)}
                             onResizeEnd={(pos) => onResizeEnd(e, pos)}
                    />
                    : <Folder4 key={currentLevel.value + "f" + e.folderId} folder={e}
                               onDragStart={() => folderRunnables.onDragStart(e)}
                               onDragUpdate={(coordinate) => folderRunnables.onDragUpdate(e, coordinate)}
                               onDragEnd={() => folderRunnables.onDragEnd(e)}
                               onTap={() => folderRunnables.onTap(e)}
                               onLongPress={(coordinate) => folderRunnables.onLongTap(e, coordinate)}
                               isEditMode={homescreenState.value === "edit"}
                               onResizeUpdate={(pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY)}
                               onResizeEnd={(pos) => onResizeEnd(e, pos)}
                               children={folders.value.filter(f=>f.parentId === e.folderId)}
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