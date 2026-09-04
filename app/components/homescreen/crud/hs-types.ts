import {HS3Element, HS3Folder, PixelPoint} from "@components/homescreen/types";

export type DragState = {
    element: HS3Element,
    coordinate: PixelPoint
    type: "drag" | "resize" | "create"
}

export type FolderDisplayLevel = {
    main: HS3Folder,
    more: HS3Folder[],
}

export type HomescreenState = "default" | "edit"