import React, {useEffect, useState} from "react";
import {HS3Element, HS3Folder, HS3Item} from './../types'
import {getFoldersFromDb} from "@components/homescreen/top-down-homescreen/db-mock";
import {Text} from "react-native-paper";
import {
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue
} from "react-native-reanimated";
import {BackHandler, ToastAndroid, View} from "react-native";

import {PixelPoint} from "@components/homescreen/types";
import {
    getFolderPath,
    getFoldersForLevel,
    getModifiedTempItems,
    goUpLevel,
} from "@components/homescreen/top-down-homescreen/top-down-util";
import {HomescreenState} from "@components/homescreen/top-down-homescreen/model-and-crud/top-down-hs-types";
import {useItemPopup} from "@components/homescreen/top-down-homescreen/item-popup";
import {Gesture} from "react-native-gesture-handler";
import {
    useCreateLayoutOverlay,
    useCreateTilePopup
} from "@components/homescreen/top-down-homescreen/useCreateTileOrFolderPopup";
import {HomescreenProvider} from "@components/homescreen/top-down-homescreen/homescreen-context";
import {Homescreen} from "@components/homescreen/top-down-homescreen/homescreen";
import {useHomescreenDragAndDrop} from "@components/homescreen/top-down-homescreen/useHomescreenDragAndDrop";

type Props = {}

export const HomescreenManager = (props: Props) => {
    //refresh
    const r = useState<boolean>(false);
    const [mountKey, setMountKey] = useState(0);
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
    const folderPath = useDerivedValue(() => {
        return getFolderPath(folders.value, currentLevel.value)
    }, [folders, currentLevel])
    const visibleElements = useDerivedValue<HS3Element[]>(() => {
        if (!currentFolderLevel.value.main) return []
        console.log("update!")
        return [
            ...currentFolderLevel.value.main.items,
            ...currentFolderLevel.value.more
        ]
    }, [currentFolderLevel])

    //----------- drag & drop (drag/resize handlers + the preview/temp-item derivation chain)
    const {
        dragState, previewElement, tempItems, tempItemsImpossible, isAddFolder,
        folderOverlayStyle,
        onDragStart, onDragUpdate, onDragEnd, onResizeUpdate, onResizeEnd,
        onFolderPopoverChange,
    } = useHomescreenDragAndDrop(
        folders, currentLevel, visibleElements,
        () => setMountKey(k => k + 1)
    )

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

    ////---------Tile / Folder Events------------
    const onFolderTap = (folder: HS3Folder) => {
        currentLevel.value = folder.folderId
    }
    ////---------Tile / Folder Events------------

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
                : 'rgba(163,102,163,0.44)',
        zIndex: 1
    }), [homescreenState.value]);

    const showCreateFABs = useSharedValue<boolean>(undefined)
    useAnimatedReaction(() => showCreateFABs.value,
        (c, p) => {
            if (c != p)
                runOnJS(refreshState)()
        }, [showCreateFABs])
    // const createTilePopup = useMo
    const createPositionOverlay = useCreateLayoutOverlay({
        onStart: (layout, coordinate) => {
            dragState.value = {
                type: "create",
                element: layout, coordinate
            }
        },
        onUpdate: (layout, coordinate) => {
            dragState.value = {
                type: "create",
                element: layout, coordinate
            }
        },
        onCancel: () => {
            dragState.value = undefined
            showCreateFABs.value = false
        },
        onConfirm: (element) => {
            if(tempItemsImpossible.value.length > 0){
                ToastAndroid.show("Error......", ToastAndroid.SHORT)
                dragState.value = undefined
                showCreateFABs.value = false
                return
            }
            let newFolders = folders.value

            if ("itemId" in element) {
                const parent = folders.value.find(f=>f.folderId === element.parentId)
                console.log("old parent", parent)
                parent.items = [...parent.items, element]
                console.log("new..?", parent)

                newFolders = folders.value.map(f =>
                    (f.folderId === element.parentId)
                        ? parent
                        : f
                )
            } else {
                newFolders = [...folders.value, element]
            }

            folders.value = getModifiedTempItems(
                tempItems.value,
                newFolders
            )

            dragState.value = undefined
            showCreateFABs.value = false
            runOnJS(setMountKey)(k => k + 1);
        }
    })
    const tileCreatePopup = useCreateTilePopup({
        folders: folders.value,
        currentLevel: currentLevel.value,
        onSubmit: (item: HS3Item) => createPositionOverlay.setElement(item)
    })


    //<Loading
    if (!currentFolderLevel.value.main) {
        return (
            <View>
                <Text variant={"headlineMedium"} style={{color: 'black'}}>Loading...</Text>
            </View>
        )
    }

    //<Main
    return <HomescreenProvider value={{
        mountKey,
        folders, currentLevel, folderPath, visibleElements,
        dragState, previewElement, isAddFolder, tempItems, tempItemsImpossible,
        homescreenState, showCreateFABs,
        folderRunnables, itemRunnables, onResizeUpdate, onResizeEnd, onFolderPopoverChange,
        editBackgroundStyle, folderOverlayStyle, longTap,
        itemPopupComponent, createPositionOverlay, tileCreatePopup,
    }}>
        <Homescreen/>
    </HomescreenProvider>
}