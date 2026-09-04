import React, {useEffect, useState} from "react";
import {HS3Element, HS3Folder, HS3Item} from './types'
import {getFoldersFromDb} from "@components/homescreen/db-mock";
import {Text} from "react-native-paper";
import {runOnJS, useAnimatedReaction, useSharedValue} from "react-native-reanimated";
import {ToastAndroid, View} from "react-native";

import {PixelPoint} from "@components/homescreen/types";
import {getModifiedTempElements} from "@components/homescreen/util";
import {useItemPopup} from "@components/homescreen/ui/item-popup";
import {useCreateLayoutOverlay, useCreateTilePopup} from "@components/homescreen/ui/useCreateTileOrFolderPopup";
import {HomescreenProvider} from "@components/homescreen/homescreen-context";
import {Homescreen} from "@components/homescreen/homescreen";
import {useHomescreenDragAndDrop} from "@components/homescreen/useHomescreenDragAndDrop";
import {useHomescreenNavigation} from "@components/homescreen/useHomescreenNavigation";
import {useHomescreenEditMode} from "@components/homescreen/useHomescreenEditMode";

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

    //----------- navigation (level, breadcrumb, back button)
    const {
        currentLevel, currentFolderLevel, folderPath, visibleElements,
        onFolderTap,
    } = useHomescreenNavigation(folders)

    //----------- drag & drop (drag/resize handlers + the preview/temp-item derivation chain)
    const {
        dragState, previewElement, tempElements, tempElementsImpossible, dropTarget,
        folderOverlayStyle,
        onDragStart, onDragUpdate, onDragEnd, onResizeUpdate, onResizeEnd,
        onFolderPopoverChange,
    } = useHomescreenDragAndDrop(
        folders, currentLevel, visibleElements,
        () => setMountKey(k => k + 1)
    )

    //----------- browsing vs. editing
    const {homescreenState, longTap, editBackgroundStyle} = useHomescreenEditMode()

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
            previewElement: previewElement.value,
            tempElements: JSON.stringify(tempElements.value),
            tempElementsImpossible: JSON.stringify(tempElementsImpossible.value),
            visibleElements: JSON.stringify(visibleElements.value),
            itemPopup: popupItem.value,
            homescreenState: homescreenState.value,
        }),
        (current, previous) => {
            if (JSON.stringify(current) !== JSON.stringify(previous)) {
                runOnJS(refreshState)();
                return
            }
        }, [currentLevel, previewElement, tempElements, tempElementsImpossible, visibleElements, popupItem, homescreenState]
    )
    // !!!!!very frequent updates!!!!
    const RESOLUTION = 10 //pixels
    useAnimatedReaction(
        () => ({
            cursorX: Math.floor(dragState.value?.coordinate?.x / RESOLUTION),
            cursorY: Math.floor(dragState.value?.coordinate?.y / RESOLUTION),
        }),
        (prepared, previous) => {
            if (!dropTarget.value)
                return //this level of accuracy is only needed when there is no bigger movement

            if (JSON.stringify(prepared) !== JSON.stringify(previous)) {
                runOnJS(refreshState)();
            }
        }, [dropTarget, dragState]
    )
    //🔁

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
            if (tempElementsImpossible.value.length > 0) {
                ToastAndroid.show("Error......", ToastAndroid.SHORT)
                dragState.value = undefined
                showCreateFABs.value = false
                return
            }
            let newFolders = folders.value

            if ("itemId" in element) {
                const parent = folders.value.find(f => f.folderId === element.parentId)
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

            folders.value = getModifiedTempElements(
                tempElements.value,
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
        dragState, previewElement, dropTarget, tempElements, tempElementsImpossible,
        homescreenState, showCreateFABs,
        folderRunnables, itemRunnables, onResizeUpdate, onResizeEnd, onFolderPopoverChange,
        editBackgroundStyle, folderOverlayStyle, longTap,
        itemPopupComponent, createPositionOverlay, tileCreatePopup,
    }}>
        <Homescreen/>
    </HomescreenProvider>
}