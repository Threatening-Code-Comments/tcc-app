import {SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue} from "react-native-reanimated";
import {ToastAndroid} from "react-native";
import {DragState, GridValue, HS3Element, HS3Folder, PixelPoint} from "@homescreen/types";
import {DragPointPosition} from "@homescreen/ui/components/drag-point";
import {FolderOperations} from "@homescreen/ui/folder-popover";
import {
    createTempElements,
    generateElementResults,
    generateTempElements,
    getModifiedTempElements,
    getTargetLayout,
} from "@homescreen/util";
import {gridPointToPixel, gridToPx} from "@homescreen/move_algo";
import {moveElementsToFolder} from "@homescreen/crud/move_elements";
import {addToNewFolder} from "@homescreen/crud/createTileOrFolder";
import {FOLDER_HOVER_OVERLAY_INSET} from "@homescreen/constants";

export type DropTarget = {
    element: HS3Element
    operation: FolderOperations
}

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
    folderId: number | undefined,
    visibleElements: SharedValue<HS3Element[]>,
    onMutated: () => void,
) {
    const dragState = useSharedValue<DragState | undefined>(undefined);

    //dragState -> preview item
    const previewElement = useDerivedValue<HS3Element>(() => {
        if (!dragState.value) {
            return undefined
        }
        if (dragState.value.type == 'drag')
            return getTargetLayout(dragState.value)
        else
            return dragState.value.element
    }, [dragState])

    //dragState, visibleElements, previewElement -> element results
    const elementResults = useDerivedValue(() => {
        return generateElementResults(dragState.value, previewElement.value, visibleElements.value);
    }, [dragState, visibleElements, previewElement])

    //elementResults -> isAddFolder
    const isAddFolder = useDerivedValue(() => {
        if (!elementResults.value) return undefined

        for (let result of elementResults.value) {
            const {element, dirs: {isAddFolder: isAddFolderR}} = result
            if (isAddFolderR) return element
        }
        return undefined
    }, [elementResults])

    //elementResults, previewElement, visibleElements -> TEMP ELEMENTS
    const tempElements = useDerivedValue(() => {
        return createTempElements(elementResults.value, previewElement.value, visibleElements.value, isAddFolder.value)
    }, [elementResults, previewElement, visibleElements, isAddFolder])

    //tempElements, visibleElements -> tempElementsImpossible
    const tempElementsImpossible = useDerivedValue(
        () => generateTempElements(tempElements.value, visibleElements.value, dragState.value),
        [tempElements, visibleElements, dragState])

    //whether hovering a folder target means "create a new folder here" or "move into it" —
    //set by FolderPopover depending on which half of it the drag is hovering over. Defaults
    //to "moveTo" so there's always a defined choice, even before the popover reports one.
    const folderOperation = useSharedValue<FolderOperations>("moveTo")
    const onFolderPopoverChange = (op: FolderOperations) => {
        folderOperation.value = op
    }

    //isAddFolder + folderOperation -> dropTarget: everything needed to resolve a drop into
    //"nothing happens" / "create a folder" / "move into a folder", in one place instead of
    //two values that have to be cross-referenced at drop time.
    const dropTarget = useDerivedValue<DropTarget | undefined>(() => {
        if (!isAddFolder.value) return undefined

        const operation: FolderOperations = ("itemId" in isAddFolder.value)
            ? "create"
            : folderOperation.value

        return {element: isAddFolder.value, operation}
    }, [isAddFolder, folderOperation])

    const onDragStart = (element: HS3Element) => {
    };
    const onDragUpdate = (element: HS3Element, coordinate: PixelPoint) => {
        dragState.value = {
            element, coordinate, type: 'drag'
        }
    };
    const onDragEnd = (element: HS3Element) => {
        const isImpossible = tempElementsImpossible.value.length > 0
        const modifiedElement: HS3Element =
            {...previewElement.value, layout: {...previewElement.value.layout}}
        const elementsToModify: HS3Element[] = [...tempElements.value, modifiedElement]
        if (isImpossible) {
            dragState.value = undefined
            folderOperation.value = "moveTo"
            ToastAndroid.show("Couldn't drop", ToastAndroid.SHORT);
            return
        }

        if (!!dropTarget.value) {
            const {element: target, operation} = dropTarget.value

            if (operation === "create") {
                folders.value = addToNewFolder(
                    modifiedElement,
                    {...target, layout: target.layout},
                    folders.value,
                    folderId
                )
            } else {
                folders.value = moveElementsToFolder(
                    [modifiedElement],
                    folders.value,
                    target as HS3Folder
                )
            }
            dragState.value = undefined
            folderOperation.value = "moveTo"
            onMutated()
            return
        }

        dragState.value = undefined
        folderOperation.value = "moveTo"
        folders.value = getModifiedTempElements(
            elementsToModify,
            folders.value
        )
        onMutated()
    };

    const onResizeUpdate = (element: HS3Element, position: DragPointPosition, deltaX: GridValue, deltaY: GridValue) => {
        const {layout} = element
        //an item must keep at least one cell — width/height 0 crashes the app
        deltaX = (position === "left") ? Math.min(deltaX, layout.width - 1) : Math.max(deltaX, 1 - layout.width)
        deltaY = (position === "top") ? Math.min(deltaY, layout.height - 1) : Math.max(deltaY, 1 - layout.height)
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
        dragState, previewElement, tempElements, tempElementsImpossible, dropTarget,
        folderOverlayStyle,
        onDragStart, onDragUpdate, onDragEnd, onResizeUpdate, onResizeEnd,
        onFolderPopoverChange,
    }
}
