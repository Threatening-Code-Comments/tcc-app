import React, {useState} from "react";
import {FAB} from "react-native-paper";
import Animated, {runOnJS, SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue} from "react-native-reanimated";
import {ToastAndroid, View} from "react-native";
import {Folder, Item} from "@components/homescreen/ui/item-and-folder";
import {PreviewItem} from "@homescreen/ui/preview-item";
import {getElementKey, getFoldersForLevel, getModifiedTempElements, isSameElement} from "@components/homescreen/util";
import {FolderPopover} from "@components/homescreen/ui/folder-popover";
import {DotGridBackground} from "@homescreen/ui/dot-grid";
import {HS3Element, HS3Folder, HS3Item} from "@components/homescreen/types";
import {useHomescreenDragAndDrop} from "@components/homescreen/useHomescreenDragAndDrop";
import {useHomescreenEditMode} from "@components/homescreen/useHomescreenEditMode";
import {useItemPopup} from "@components/homescreen/ui/item-popup";
import {useCreateLayoutOverlay, useCreateTilePopup} from "@components/homescreen/ui/useCreateTileOrFolderPopup";
import {GestureDetector} from "react-native-gesture-handler";

type Props = {
    folderId: number | undefined,
    folders: SharedValue<HS3Folder[]>,
    onEnterFolder: (folderId: number) => void,
}

/**
 * One folder level. Remounted (via `key={folderId}` at the call site in the navigator)
 * whenever the active folder changes, so everything in here — drag state, edit mode,
 * popups, create-flow — naturally resets per level without manual cleanup.
 */
export const Homescreen = ({folderId, folders, onEnterFolder}: Props) => {
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

    const {homescreenState, longTap, editBackgroundStyle} = useHomescreenEditMode()
    const isEditMode = homescreenState.value === "edit"

    const onElementTap = (e: HS3Element) => {
        if ("itemId" in e) {
            console.log("ITEM HAS BEEN TUOCHED", e.itemId)
        } else {
            onEnterFolder(e.folderId)
        }
    }

    const popupItem = useSharedValue<HS3Item | undefined>(undefined)
    const onLongTap = (e: HS3Element) => {
        if ("itemId" in e)
            popupItem.value = e
    }
    const {
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

    //🔁 same "bridge SharedValue changes into a React re-render" pattern as elsewhere
    useAnimatedReaction(
        () => ({
            previewElement: previewElement.value,
            tempElements: JSON.stringify(tempElements.value),
            tempElementsImpossible: JSON.stringify(tempElementsImpossible.value),
            visibleElements: JSON.stringify(visibleElements.value),
            homescreenState: homescreenState.value,
            popupItem: popupItem.value,
        }),
        (current, previous) => {
            if (JSON.stringify(current) !== JSON.stringify(previous)) {
                runOnJS(refreshState)();
            }
        }, [previewElement, tempElements, tempElementsImpossible, visibleElements, homescreenState, popupItem]
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

    const [showCreateFABs, setShowCreateFABs] = useState(false)
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
            setShowCreateFABs(false)
        },
        onConfirm: (element) => {
            if (tempElementsImpossible.value.length > 0) {
                ToastAndroid.show("Error......", ToastAndroid.SHORT)
                dragState.value = undefined
                setShowCreateFABs(false)
                return
            }
            let newFolders = folders.value

            if ("itemId" in element) {
                const parent = folders.value.find(f => f.folderId === element.parentId)
                parent.items = [...parent.items, element]

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
            setShowCreateFABs(false)
            setMountKey(k => k + 1)
        }
    })
    const tileCreatePopup = useCreateTilePopup({
        folders: folders.value,
        currentLevel: folderId,
        onSubmit: (item: HS3Item) => createPositionOverlay.setElement(item)
    })

    const impossibleElementKeys = new Set(tempElementsImpossible.value.map(getElementKey))

    const stableElements = visibleElements.value
        .filter(e => !tempElements.value.some(e2 => isSameElement(e, e2)))

    const createFabProps = showCreateFABs
        ? {icon: "window-close", label: "Cancel", variant: "tertiary" as const}
        : {icon: "plus", label: "", variant: "primary" as const}

    const renderElement = (e: HS3Element) =>
        ("itemId" in e)
            ? <Item key={`${mountKey}-t-${e.itemId}`} item={e}
                    onDragStart={() => onDragStart(e)}
                    onDragUpdate={(coordinate) => onDragUpdate(e, coordinate)}
                    onDragEnd={() => onDragEnd(e)}
                    onTap={() => onElementTap(e)}
                    onLongPress={() => onLongTap(e)}
                    isEditMode={isEditMode}
                    onResizeUpdate={(pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY)}
                    onResizeEnd={(pos) => onResizeEnd(e, pos)}
            />
            : <Folder key={`${mountKey}-f-${e.folderId}`} folder={e}
                      onDragStart={() => onDragStart(e)}
                      onDragUpdate={(coordinate) => onDragUpdate(e, coordinate)}
                      onDragEnd={() => onDragEnd(e)}
                      onTap={() => onElementTap(e)}
                      onLongPress={() => onLongTap(e)}
                      isEditMode={isEditMode}
                      onResizeUpdate={(pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY)}
                      onResizeEnd={(pos) => onResizeEnd(e, pos)}
                      children={folders.value.filter(f => f.parentId === e.folderId)}
            />

    return <>
        <GestureDetector gesture={longTap}>
            <Animated.View style={editBackgroundStyle}>
                <DotGridBackground mode={homescreenState.value}/>
            </Animated.View>
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

        {createPositionOverlay.component}
        {tileCreatePopup.component}
        <FAB style={{
            position: "absolute",
            right: 20, bottom: 150,
            zIndex: 100,
        }} size={"medium"}
             {...createFabProps}
             onPress={() => setShowCreateFABs(v => !v)}
        />

        {showCreateFABs
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

        {stableElements.map(renderElement)}
    </>
}
