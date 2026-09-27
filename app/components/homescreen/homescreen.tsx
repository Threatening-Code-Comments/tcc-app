import React, {useEffect, useState} from "react";
import {Alert, View} from "react-native";
import Animated, {runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue} from "react-native-reanimated";
import {Folder, Item} from "@components/homescreen/ui/item-and-folder";
import {MovableItemProps} from "@components/homescreen/ui/movable-item";
import {PreviewItem} from "@homescreen/ui/components/preview-item";
import {getElementKey, getFoldersForLevel, isSameElement} from "@components/homescreen/util";
import {FolderPopover} from "@components/homescreen/ui/folder-popover";
import {DotGridBackground} from "@homescreen/ui/components/dot-grid";
import {CreateElementControls} from "@homescreen/ui/create-element-controls";
import {HS3Element} from "@components/homescreen/types";
import {useHomescreenDragAndDrop} from "@homescreen/hooks/useHomescreenDragAndDrop";
import {useHomescreenEditMode} from "@homescreen/hooks/useHomescreenEditMode";
import {useElementPopup} from "@components/homescreen/hooks/useItemPopup";
import {deleteElement} from "@homescreen/crud/delete_elements";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";
import {GestureDetector} from "react-native-gesture-handler";

type Props = {
    folderId: number | undefined,
    onEnterFolder: (folderId: number) => void,
}

/**
 * One folder level. Remounted (via `key={folderId}` at the call site in the navigator)
 * whenever the active folder changes, so everything in here — drag state, edit mode,
 * popups, create-flow — naturally resets per level without manual cleanup.
 */
export const Homescreen = ({folderId, onEnterFolder}: Props) => {
    const {folders, dragPreview} = useHomescreenData()
    //refresh: bridges Reanimated shared-value changes back into a React re-render,
    //since this component reads .value directly in its JSX below.
    const [, setRefreshTick] = useState(false)
    const refreshState = () => setRefreshTick(t => !t)
    const [mountKey, setMountKey] = useState(0)

    const currentFolderLevel = useDerivedValue(() => {
        return getFoldersForLevel(folders.value, folderId)
    }, [folders, folderId])
    const visibleElements = useDerivedValue<HS3Element[]>(() => {
        if (!currentFolderLevel.value.main) return []
        return [
            ...currentFolderLevel.value.main.items,
            ...currentFolderLevel.value.more
        ]
    }, [currentFolderLevel])

    const {
        dragState, previewElement, tempElements, tempElementsImpossible, dropTarget,
        folderOverlayStyle,
        onDragStart, onDragUpdate, onDragEnd, onResizeUpdate, onResizeEnd,
        onFolderPopoverChange,
    } = useHomescreenDragAndDrop(
        folders, folderId, visibleElements,
        () => setMountKey(k => k + 1)
    )

    const {homescreenState, longTap} = useHomescreenEditMode()
    //also treated as edit mode while a tile is being dragged in from the App Drawer —
    //the same wiggle/dot-grid signal applies, it just wasn't triggered by a long-press here.
    const isEditMode = homescreenState.value === "edit" || !!dragPreview.value

    const onElementTap = (e: HS3Element) => {
        if ("itemId" in e) {
            console.log("ITEM HAS BEEN TUOCHED", e.itemId)
        } else {
            onEnterFolder(e.folderId)
        }
    }

    //the edit-mode "×": only takes the placement off the homescreen (the tile stays in the
    //App Drawer). Items go right away; a folder with anything in it asks first, since its
    //whole contents go with it.
    const removeElement = (e: HS3Element) => {
        const apply = () => {
            folders.value = deleteElement(e, folders.value)
            setMountKey(k => k + 1)
        }
        if ("itemId" in e) return apply()

        const childCount = e.items.length + folders.value.filter(f => f.parentId === e.folderId).length
        if (childCount === 0) return apply()

        Alert.alert(
            `Remove "${e.name}"?`,
            `Its ${childCount} element(s) are removed from the homescreen too. Tiles stay in the App Drawer.`,
            [
                {text: "Cancel", style: "cancel"},
                {text: "Remove", style: "destructive", onPress: apply},
            ]
        )
    }

    const popupItem = useSharedValue<HS3Element | undefined>(undefined)
    const onLongTap = (e: HS3Element) => {
        popupItem.value = e
    }
    const {
        visible: itemPopupOpen,
        setVisible: setItemPopupOpen,
        component: itemPopupComponent
    } = useElementPopup({
        element: popupItem.value,
        folders: folders.value,
        onDelete: (e) => {
            folders.value = deleteElement(e, folders.value)
            popupItem.value = undefined
            setMountKey(k => k + 1)
        },
    })
    //closing the popup (backdrop/back) has to clear the selection too, otherwise a second
    //long-press on the same element wouldn't count as a change and never reopen it.
    useEffect(() => {
        if (!itemPopupOpen) popupItem.value = undefined
    }, [itemPopupOpen])
    useAnimatedReaction(
        () => ({item: popupItem.value}),
        (curr, prev) => {
            if (JSON.stringify(curr) !== JSON.stringify(prev)) {
                runOnJS(setItemPopupOpen)(!!(curr.item))
            }
        }, [popupItem]
    )

    //🔁 same "bridge SharedValue changes into a React re-render" pattern as elsewhere
    useAnimatedReaction(
        () => ({
            previewElement: previewElement.value,
            tempElements: JSON.stringify(tempElements.value),
            tempElementsImpossible: JSON.stringify(tempElementsImpossible.value),
            visibleElements: JSON.stringify(visibleElements.value),
            homescreenState: homescreenState.value,
            popupItem: popupItem.value,
            isExternalDrag: !!dragPreview.value,
        }),
        (current, previous) => {
            if (JSON.stringify(current) !== JSON.stringify(previous)) {
                runOnJS(refreshState)();
            }
        }, [previewElement, tempElements, tempElementsImpossible, visibleElements, homescreenState, popupItem, dragPreview]
    )
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

    const impossibleElementKeys = new Set(tempElementsImpossible.value.map(getElementKey))

    const stableElements = visibleElements.value
        .filter(e => !tempElements.value.some(e2 => isSameElement(e, e2)))

    const renderElement = (e: HS3Element) => {
        //shared between Item and Folder — both are Omit<MovableItemProps, "children"|"layout">,
        //and only differ in the item/folder prop itself plus Folder's own `children` (sub-folders).
        const sharedProps: Omit<MovableItemProps, "children" | "layout"> = {
            onDragStart: () => onDragStart(e),
            onDragUpdate: (coordinate) => onDragUpdate(e, coordinate),
            onDragEnd: () => onDragEnd(e),
            onTap: () => onElementTap(e),
            onLongPress: () => onLongTap(e),
            isEditMode,
            onResizeUpdate: (pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY),
            onResizeEnd: (pos) => onResizeEnd(e, pos),
            onRemove: () => removeElement(e),
        }

        return ("itemId" in e)
            ? <Item key={`${mountKey}-t-${e.itemId}`} item={e} {...sharedProps}/>
            : <Folder key={`${mountKey}-f-${e.folderId}`} folder={e} {...sharedProps}
                      children={folders.value.filter(f => f.parentId === e.folderId)}/>
    }

    return <>
        <GestureDetector gesture={longTap}>
            <View style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1}}>
                <DotGridBackground mode={isEditMode ? "edit" : "default"}/>
            </View>
        </GestureDetector>

        {!dropTarget.value && (<PreviewItem
            element={previewElement.value}
            impossible={false}
            isDragElement={true}
            isCreateElement={dragState.value?.type === "create"}
        />)}
        <Animated.View style={folderOverlayStyle}/>
        <FolderPopover isAddFolder={dropTarget.value?.element} dragState={dragState.value}
                       onOperationChange={(op) => onFolderPopoverChange(op)}/>

        {itemPopupComponent}

        {tempElements.value.map(i => (
            <PreviewItem
                key={getElementKey(i)}
                element={i}
                impossible={impossibleElementKeys.has(getElementKey(i))}
            />
        ))}

        <CreateElementControls
            folderId={folderId}
            dragState={dragState} tempElements={tempElements} tempElementsImpossible={tempElementsImpossible}
            onMutated={() => setMountKey(k => k + 1)}
        />

        {stableElements.map(renderElement)}
    </>
}
