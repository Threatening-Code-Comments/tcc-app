import React, {createContext, useContext} from "react";
import {SharedValue} from "react-native-reanimated";
import {GridValue, HS3Element, HS3Folder, PixelPoint, DragState, HomescreenState} from "@components/homescreen/types";
import {DragPointPosition} from "@components/homescreen/ui/drag-point";
import {FolderOperations} from "@components/homescreen/ui/folder-popover";
import {DropTarget} from "@components/homescreen/useHomescreenDragAndDrop";

/**
 * Everything the `Homescreen` render component needs, bundled as-is from `HomescreenManager`.
 * This is a straight extraction of what the old manager's JSX used directly — no regrouping yet.
 */
export type HomescreenContextValue = {
    mountKey: number,

    folders: SharedValue<HS3Folder[]>,
    currentLevel: SharedValue<number | undefined>,
    folderPath: SharedValue<HS3Folder[]>,
    visibleElements: SharedValue<HS3Element[]>,

    dragState: SharedValue<DragState | undefined>,
    previewElement: SharedValue<HS3Element | undefined>,
    dropTarget: SharedValue<DropTarget | undefined>,
    tempElements: SharedValue<HS3Element[]>,
    tempElementsImpossible: SharedValue<HS3Element[]>,

    homescreenState: SharedValue<HomescreenState>,
    showCreateFABs: SharedValue<boolean>,

    onDragStart: (e: HS3Element) => void,
    onDragUpdate: (e: HS3Element, coordinate: PixelPoint) => void,
    onDragEnd: (e: HS3Element) => void,
    onElementTap: (e: HS3Element) => void,
    onLongTap: (e: HS3Element, coordinate: PixelPoint) => void,
    onResizeUpdate: (element: HS3Element, position: DragPointPosition, deltaX: GridValue, deltaY: GridValue) => void,
    onResizeEnd: (element: HS3Element, pos: DragPointPosition) => void,
    onFolderPopoverChange: (op: FolderOperations) => void,

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editBackgroundStyle: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    folderOverlayStyle: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    longTap: any,

    itemPopupComponent: React.ReactNode,
    createPositionOverlay: { component: React.ReactNode },
    tileCreatePopup: { component: React.ReactNode, setVisible: (v: boolean) => void },
}

const HomescreenContext = createContext<HomescreenContextValue | undefined>(undefined)

export const HomescreenProvider = HomescreenContext.Provider

export function useHomescreenContext(): HomescreenContextValue {
    const ctx = useContext(HomescreenContext)
    if (!ctx) throw new Error("useHomescreenContext must be used within a HomescreenProvider")
    return ctx
}
