import {HS3Element, HS3Folder} from "@components/homescreen/3-homescreen/3_homescreenHandler";
import {PixelPoint} from "@components/homescreen/types";

export type DragState4 = {
    element: HS3Element,
    coordinate: PixelPoint
}

export type FolderDisplayLevel = {
    main: HS3Folder,
    more: HS3Folder[],
}

export type HomescreenState = "default" | "edit"