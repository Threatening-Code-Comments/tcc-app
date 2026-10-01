import React, {useCallback, useEffect, useState} from "react";
import {Alert, View} from "react-native";
import Animated, {
    runOnJS,
    SharedValue,
    useAnimatedReaction,
    useDerivedValue,
    useSharedValue
} from "react-native-reanimated";
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
import {DragState, HomescreenState, HS3Element, HS3Folder, HS3Item} from "@components/homescreen/types";
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
//What this level renders, as plain React state. The drag/folder state itself lives in shared
//values on the UI thread; a reaction below pushes the parts React needs into here whenever
//they actually change (see useLevelView). Rendering never reads .value — each read on the JS
//thread is a synchronous round trip to the (during a drag: busy) UI thread.
type LevelView = {
    folders: HS3Folder[],
    visibleElements: HS3Element[],
    //pushed-away neighbours while dragging, and which of them can't go where they'd be pushed
    tempElements: HS3Element[],
    impossibleElements: HS3Element[],
    //the element being dragged/created (for the preview's name and colour), undefined = no drag
    dragElement: HS3Element | undefined,
    isCreate: boolean,
    isEditMode: boolean,
    popupItem: HS3Element | undefined,
}

export const Homescreen = ({folderId, onEnterFolder}: Props) => {
    const {folders, dragPreview, homescreenAreaBounds, appDrawerDrop} = useHomescreenData()
    const [mountKey, setMountKey] = useState(0)
    //stable, so memoized children (CreateElementControls) don't re-render because of it
    const remount = useCallback(() => setMountKey(k => k + 1), [])

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

    const {homescreenState, longTap} = useHomescreenEditMode()

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

        //an event handler, not render — reading the current value here is fine
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

    const view = useLevelView({
        folders, visibleElements, tempElements, tempElementsImpossible, previewElement, dragState,
        homescreenState, dragPreview, popupItem, folderId,
    })

    const {
        visible: itemPopupOpen,
        setVisible: setItemPopupOpen,
        component: itemPopupComponent
    } = useElementPopup({
        element: view.popupItem,
        folders: view.folders,
        managedByRoutine: !!view.popupItem && "itemId" in view.popupItem
            && isManagedByRoutine(view.popupItem, view.folders),
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

    //the drag preview steps aside while a drop target is hovered (the popover/overlay show)
    const previewHidden = useDerivedValue(() => !!dropTarget.value, [dropTarget])

    const isEditMode = view.isEditMode
    const impossibleElementKeys = new Set(view.impossibleElements.map(getElementKey))

    const stableElements = view.visibleElements
        .filter(e => !view.tempElements.some(e2 => isSameElement(e, e2)))

    const renderElement = (e: HS3Element) => {
        //shared between Item and Folder — both are Omit<MovableItemProps, "children"|"layout">,
        //and only differ in the item/folder prop itself plus Folder's own `children` (sub-folders).
        const sharedProps: Omit<MovableItemProps, "children" | "layout"> = {
            onDragStart: () => onDragStart(e),
            //a worklet, called by the pan gesture on the UI thread (see useHomescreenDragAndDrop)
            onDragUpdate: (coordinate) => {
                "worklet"
                onDragUpdate(e, coordinate)
            },
            onDragEnd: () => onDragEnd(e),
            onTap: () => onElementTap(e),
            onLongPress: () => onLongTap(e),
            isEditMode,
            onResizeUpdate: (pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY),
            onResizeEnd: (pos) => onResizeEnd(e, pos),
            //a routine's own tile in its linked folder would just come back on the next sync
            onRemove: ("itemId" in e && isManagedByRoutine(e, view.folders)) ? undefined : () => removeElement(e),
        }

        return ("itemId" in e)
            ? <Item key={`${mountKey}-t-${e.itemId}`} item={e} {...sharedProps}/>
            : <Folder key={`${mountKey}-f-${e.folderId}`} folder={e} {...sharedProps}
                      children={view.folders.filter(f => f.parentId === e.folderId)}/>
    }

    return <>
        <GestureDetector gesture={longTap}>
            <View style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1}}>
                <DotGridBackground mode={isEditMode ? "edit" : "default"}/>
            </View>
        </GestureDetector>

        {!!view.dragElement && (<PreviewItem
            element={view.dragElement}
            layoutSource={previewElement}
            hiddenSource={previewHidden}
            impossible={false}
            isDragElement={true}
            isCreateElement={view.isCreate}
        />)}
        <Animated.View style={folderOverlayStyle}/>
        <FolderPopover dropTarget={dropTarget} dragState={dragState}
                       onOperationChange={onFolderPopoverChange}/>

        {itemPopupComponent}

        {view.tempElements.map(i => (
            <PreviewItem
                key={getElementKey(i)}
                element={i}
                impossible={impossibleElementKeys.has(getElementKey(i))}
            />
        ))}

        <CreateElementControls
            folderId={folderId}
            dragState={dragState} tempElements={tempElements} tempElementsImpossible={tempElementsImpossible}
            onMutated={remount}
        />

        {stableElements.map(renderElement)}
    </>
}

type LevelViewSources = {
    folders: SharedValue<HS3Folder[]>,
    visibleElements: SharedValue<HS3Element[]>,
    tempElements: SharedValue<HS3Element[]>,
    tempElementsImpossible: SharedValue<HS3Element[]>,
    previewElement: SharedValue<HS3Element | undefined>,
    dragState: SharedValue<DragState | undefined>,
    homescreenState: SharedValue<HomescreenState>,
    dragPreview: SharedValue<unknown>,
    popupItem: SharedValue<HS3Element | undefined>,
    folderId: number | undefined,
}

/**
 * Keeps a LevelView in React state in step with the shared values: a reaction on the UI
 * thread notices what changed and pushes just those fields over (runOnJS with the values
 * themselves). That replaces the old pattern of poking a dummy state to re-render and then
 * pulling every value back with .value during render. It runs on every drag frame, so the
 * comparisons stay cheap: references for the big lists (only reassigned on real changes),
 * small strings for the temp elements and the dragged element.
 */
function useLevelView(s: LevelViewSources): LevelView {
    const [view, setView] = useState<LevelView>(() => {
        //one-off when the level mounts; afterwards the reaction keeps it current
        const all = s.folders.value
        const level = getFoldersForLevel(all, s.folderId)
        return {
            folders: all,
            visibleElements: level.main ? [...level.main.items, ...level.more] : [],
            tempElements: [],
            impossibleElements: [],
            dragElement: undefined,
            isCreate: false,
            isEditMode: s.homescreenState.value === "edit" || !!s.dragPreview.value,
            popupItem: undefined,
        }
    })
    const applyPatch = (patch: Partial<LevelView>) => setView(v => ({...v, ...patch}))

    useAnimatedReaction(
        () => {
            const temp = s.tempElements.value
            const impossible = s.tempElementsImpossible.value
            const state = s.dragState.value
            const dragElement = (s.previewElement.value && state) ? state.element : undefined
            return {
                folders: s.folders.value,
                visibleElements: s.visibleElements.value,
                temp, impossible,
                tempKey: JSON.stringify(temp),
                impossibleKey: JSON.stringify(impossible),
                dragElement,
                //an App Drawer drag hands in a fresh object every frame — compare by identity
                //of what's dragged, not by reference
                dragKey: !dragElement ? ""
                    : ("itemId" in dragElement)
                        ? `t${dragElement.itemId}:${dragElement.tileId}`
                        : `f${dragElement.folderId}`,
                isCreate: state?.type === "create",
                //also edit mode while a tile is dragged in from the App Drawer — the same
                //wiggle/dot-grid signal, it just wasn't triggered by a long-press here
                isEditMode: s.homescreenState.value === "edit" || !!s.dragPreview.value,
                popupItem: s.popupItem.value,
            }
        },
        (cur, prev) => {
            const patch: Partial<LevelView> = {}
            let changed = false
            if (!prev || cur.folders !== prev.folders) {
                patch.folders = cur.folders
                changed = true
            }
            if (!prev || cur.visibleElements !== prev.visibleElements) {
                patch.visibleElements = cur.visibleElements
                changed = true
            }
            if (!prev || cur.tempKey !== prev.tempKey) {
                patch.tempElements = cur.temp
                changed = true
            }
            if (!prev || cur.impossibleKey !== prev.impossibleKey) {
                patch.impossibleElements = cur.impossible
                changed = true
            }
            if (!prev || cur.dragKey !== prev.dragKey) {
                patch.dragElement = cur.dragElement
                changed = true
            }
            if (!prev || cur.isCreate !== prev.isCreate) {
                patch.isCreate = cur.isCreate
                changed = true
            }
            if (!prev || cur.isEditMode !== prev.isEditMode) {
                patch.isEditMode = cur.isEditMode
                changed = true
            }
            if (!prev || cur.popupItem !== prev.popupItem) {
                patch.popupItem = cur.popupItem
                changed = true
            }
            if (changed) runOnJS(applyPatch)(patch)
        }, [s.folders, s.visibleElements, s.tempElements, s.tempElementsImpossible, s.previewElement,
            s.dragState, s.homescreenState, s.dragPreview, s.popupItem]
    )
    return view
}
