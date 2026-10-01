import React, {useEffect, useState} from "react";
import {Alert, View} from "react-native";
import Animated, {runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue} from "react-native-reanimated";
import {Folder, Item} from "@components/homescreen/ui/item-and-folder";
import {MovableItemProps} from "@components/homescreen/ui/movable-item";
import {PreviewItem} from "@homescreen/ui/components/preview-item";
import {
    getAppDrawerDragPoint,
    getElementKey,
    getFoldersForLevel,
    getNextId,
    isSameElement
} from "@components/homescreen/util";
import {FolderPopover} from "@components/homescreen/ui/folder-popover";
import {DotGridBackground} from "@homescreen/ui/components/dot-grid";
import {CreateElementControls} from "@homescreen/ui/create-element-controls";
import {HS3Element, HS3Item} from "@components/homescreen/types";
import {useHomescreenDragAndDrop} from "@homescreen/hooks/useHomescreenDragAndDrop";
import {useHomescreenEditMode} from "@homescreen/hooks/useHomescreenEditMode";
import {useElementPopup} from "@components/homescreen/hooks/useItemPopup";
import {deleteElement} from "@homescreen/crud/delete_elements";
import {isManagedByRoutine} from "@homescreen/crud/routine_folders";
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
    const {folders, dragPreview, homescreenAreaBounds, appDrawerDrop} = useHomescreenData()
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
        onDragStart, onDragUpdate, onDragEnd, onDragCancel, onResizeUpdate, onResizeEnd,
        onFolderPopoverChange,
    } = useHomescreenDragAndDrop(
        folders, folderId, visibleElements,
        () => setMountKey(k => k + 1)
    )

    //App Drawer drag → this level's own drag: the tile becomes a not-yet-placed item and runs
    //through the exact same pipeline as dragging an existing one (push neighbours away,
    //"Couldn't drop", create folder / move into folder). Root level only — a folder opens as
    //a Modal on top of everything, so the drawer can't even be reached while one is open.
    const isRootLevel = folderId === undefined
    const onAppDrawerHover = (tileId: number, x: number, y: number) => {
        const draggedItem: HS3Item = {
            itemId: getNextId("item", folders.value),
            tileId,
            parentId: folderId,
            layout: {x: 0, y: 0, width: 1, height: 1}, //position comes from the drag coordinate
        }
        onDragUpdate(draggedItem, {x, y})
    }
    useAnimatedReaction(
        () => {
            const preview = dragPreview.value
            if (!preview) return undefined
            const point = getAppDrawerDragPoint(preview, homescreenAreaBounds.value)
            //null = over the cancel bar / off the homescreen: no preview, nothing pushed away
            return point ? {tileId: preview.tile.id, x: point.x, y: point.y} : null
        },
        (current, previous) => {
            //undefined = drag ended; the drop handler below resolves it
            if (!isRootLevel || current === undefined) return
            if (current === null) {
                if (previous) runOnJS(onDragCancel)()
                return
            }
            runOnJS(onAppDrawerHover)(current.tileId, current.x, current.y)
        }, [dragPreview, homescreenAreaBounds]
    )
    useEffect(() => {
        if (!isRootLevel) return
        appDrawerDrop.current = (cancelled) => {
            if (cancelled || !dragState.value) {
                onDragCancel()
                return false
            }
            return onDragEnd(dragState.value.element)
        }
        return () => {
            appDrawerDrop.current = undefined
        }
    })

    //Shared values are read into locals once per render and only the locals are used below.
    //Each .value read on the JS thread is a synchronous round trip to the UI thread — which
    //is busy while dragging — and reading them per element (folders per item/folder, temp
    //elements per visible element) made every re-render wait dozens of times. The preview
    //only moves as fast as this component re-renders, so that showed up as a laggy drag.
    const foldersNow = folders.value

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

        const childCount = e.items.length + foldersNow.filter(f => f.parentId === e.folderId).length
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
    const popupItemNow = popupItem.value
    const onLongTap = (e: HS3Element) => {
        popupItem.value = e
    }
    const {
        visible: itemPopupOpen,
        setVisible: setItemPopupOpen,
        component: itemPopupComponent
    } = useElementPopup({
        element: popupItemNow,
        folders: foldersNow,
        managedByRoutine: !!popupItemNow && "itemId" in popupItemNow
            && isManagedByRoutine(popupItemNow, foldersNow),
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

    //the rest of the render's shared-value reads, once each (see foldersNow above)
    const tempElementsNow = tempElements.value
    const dropTargetNow = dropTarget.value
    const dragStateNow = dragState.value
    const previewElementNow = previewElement.value

    const impossibleElementKeys = new Set(tempElementsImpossible.value.map(getElementKey))

    const stableElements = visibleElements.value
        .filter(e => !tempElementsNow.some(e2 => isSameElement(e, e2)))

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
            //a routine's own tile in its linked folder would just come back on the next sync
            onRemove: ("itemId" in e && isManagedByRoutine(e, foldersNow)) ? undefined : () => removeElement(e),
        }

        return ("itemId" in e)
            ? <Item key={`${mountKey}-t-${e.itemId}`} item={e} {...sharedProps}/>
            : <Folder key={`${mountKey}-f-${e.folderId}`} folder={e} {...sharedProps}
                      children={foldersNow.filter(f => f.parentId === e.folderId)}/>
    }

    return <>
        <GestureDetector gesture={longTap}>
            <View style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1}}>
                <DotGridBackground mode={isEditMode ? "edit" : "default"}/>
            </View>
        </GestureDetector>

        {!dropTargetNow && (<PreviewItem
            element={previewElementNow}
            impossible={false}
            isDragElement={true}
            isCreateElement={dragStateNow?.type === "create"}
        />)}
        <Animated.View style={folderOverlayStyle}/>
        <FolderPopover isAddFolder={dropTargetNow?.element} dragState={dragStateNow}
                       onOperationChange={(op) => onFolderPopoverChange(op)}/>

        {itemPopupComponent}

        {tempElementsNow.map(i => (
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
