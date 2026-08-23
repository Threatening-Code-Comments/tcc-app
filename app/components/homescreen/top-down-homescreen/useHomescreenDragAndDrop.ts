import {
    SharedValue,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue
} from "react-native-reanimated";
import {ToastAndroid} from "react-native";
import {GridValue, HS3Element, HS3Folder, PixelPoint} from "@components/homescreen/types";
import {DragState4} from "@components/homescreen/top-down-homescreen/model-and-crud/top-down-hs-types";
import {DragPointPosition} from "@components/homescreen/top-down-homescreen/drag-point";
import {FolderOperations} from "@components/homescreen/top-down-homescreen/folder-popover";
import {
    createTempElements,
    generateItemResults,
    generateTempItems,
    getModifiedTempItems,
    getTargetLayout4,
} from "@components/homescreen/top-down-homescreen/top-down-util";
import {gridPointToPixel, gridToPx} from "@components/homescreen/move_algo";
import {moveElementsToFolder} from "@components/homescreen/top-down-homescreen/model-and-crud/move_elements";
import {addToNewFolder} from "@components/homescreen/top-down-homescreen/model-and-crud/createTileOrFolder";
import {FOLDER_HOVER_OVERLAY_INSET} from "@components/homescreen/constants";

function applyModificationToElement(modifiedElement: HS3Element, folders: SharedValue<HS3Folder[]>) {
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
}

/**
 * Everything that mediates between `dragState` and `folders` while a drag/resize is in
 * progress: the derived preview/temp-item chain, and the handlers that read/write it.
 * Doesn't know about the DB, navigation, popups, or edit-mode — just "what happens during a drag".
 */
export function useHomescreenDragAndDrop(
    folders: SharedValue<HS3Folder[]>,
    currentLevel: SharedValue<number | undefined>,
    visibleElements: SharedValue<HS3Element[]>,
    onMutated: () => void,
) {
    const dragState = useSharedValue<DragState4 | undefined>(undefined);

    //dragState -> preview item
    const previewElement = useDerivedValue<HS3Element>(() => {
        if (!dragState.value) {
            return undefined
        }
        if (dragState.value.type == 'drag')
            return getTargetLayout4(dragState.value)
        else
            return dragState.value.element
    }, [dragState])

    //dragState, visibleElements, previewElement -> item results
    const itemResults = useDerivedValue(() => {
        return generateItemResults(dragState.value, previewElement.value, visibleElements.value);
    }, [dragState, visibleElements, previewElement])

    //itemResults -> isAddFolder
    const isAddFolder = useDerivedValue(() => {
        if (!itemResults.value) return undefined

        for (let result of itemResults.value) {
            const {element, dirs: {isAddFolder: isAddFolderR}} = result
            if (isAddFolderR) return element
        }
        return undefined
    }, [itemResults])

    //itemResults, previewElement, visibleElements -> TEMP ITEMS
    const tempItems = useDerivedValue(() => {
        return createTempElements(itemResults.value, previewElement.value, visibleElements.value, isAddFolder.value)
    }, [itemResults, previewElement, visibleElements, isAddFolder])

    //tempItems, visibleElements -> tempItemsImpossible
    const tempItemsImpossible = useDerivedValue(
        () => generateTempItems(tempItems.value, visibleElements.value, dragState.value),
        [tempItems, visibleElements, dragState])

    //whether the current drop target (a folder) means "create a new folder here" or "move into it" —
    //set by FolderPopover depending on which half of it the drag is hovering over
    const folderOperation = useSharedValue<FolderOperations | undefined>(undefined)
    const onFolderPopoverChange = (op?: FolderOperations) => {
        folderOperation.value = op
    }

    const onDragStart = (element: HS3Element) => {
    };
    const onDragUpdate = (element: HS3Element, coordinate: PixelPoint) => {
        dragState.value = {
            element, coordinate, type: 'drag'
        }
    };
    const onDragEnd = (element: HS3Element) => {
        const isImpossible = tempItemsImpossible.value.length > 0
        const modifiedElement: HS3Element =
            {...previewElement.value, layout: {...previewElement.value.layout}}
        const elementsToModify: HS3Element[] = [...tempItems.value, modifiedElement]
        if (isImpossible) {
            dragState.value = undefined
            folderOperation.value = undefined
            ToastAndroid.show("Couldn't drop", ToastAndroid.SHORT);
            return
        }

        if (!!isAddFolder.value) {
            const isCreateFolder = "itemId" in isAddFolder.value ||
                (!!folderOperation.value && folderOperation.value === "create")

            if (isCreateFolder) {
                folders.value = addToNewFolder(
                    modifiedElement,
                    {...isAddFolder.value, layout: isAddFolder.value.layout},
                    folders.value,
                    currentLevel.value
                )
            } else {
                folders.value = moveElementsToFolder(
                    [modifiedElement],
                    folders.value,
                    isAddFolder.value
                )
            }
            dragState.value = undefined
            folderOperation.value = undefined
            onMutated()
            return
        }

        dragState.value = undefined
        folderOperation.value = undefined
        folders.value = getModifiedTempItems(
            elementsToModify,
            folders.value
        )
        onMutated()
    };

    const onResizeUpdate = (element: HS3Element, position: DragPointPosition, deltaX: GridValue, deltaY: GridValue) => {
        const {layout} = element
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
        applyModificationToElement(modifiedElement, folders);

        dragState.value = undefined
        onMutated()
    }

    const folderOverlayStyle = useAnimatedStyle(() => {
        if (!isAddFolder.value) return {
            position: 'absolute',
            left: 0, top: 0, width: 0, height: 0,
            backgroundColor: 'transparent',
            zIndex: 7
        };

        const {layout: {x, y, width, height}} = isAddFolder.value

        const pxVals = {
            ...gridPointToPixel({x, y}),
            width: gridToPx(width), height: gridToPx(height)
        }

        const n = FOLDER_HOVER_OVERLAY_INSET

        return {
            position: 'absolute',
            left: pxVals.x + (pxVals.width * (1 - n) / 2),
            top: pxVals.y + (pxVals.height * (1 - n) / 2),
            width: pxVals.width * n,
            height: pxVals.height * n,
            backgroundColor: 'green',
            zIndex: 7
        }
    }, [isAddFolder.value]);

    return {
        dragState, previewElement, tempItems, tempItemsImpossible, isAddFolder,
        folderOverlayStyle,
        onDragStart, onDragUpdate, onDragEnd, onResizeUpdate, onResizeEnd,
        onFolderPopoverChange,
    }
}
