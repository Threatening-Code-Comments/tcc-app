import {PlacementGrid} from "./placementGrid";
export type {Tile, TileEvent, Routine} from "@app/constants/DbTypes";

export type PixelValue = number;
export type GridValue = number

export type GridPoint = {
    x: number
    y: number
};

export type GridTile = GridPoint & {
    width: number
    height: number
}

export type PixelPoint = {
    x: number
    y: number
}

export type PixelTile = PixelPoint & {
    width: number
    height: number
}

export type GridPlacementList = PlacementGrid //(GridPoint & { item: HomescreenItem })[]

export type HomescreenItem = GridTile & {
    id: number
}
export type PixelItem = PixelTile & {
    id: number
}

//what the homescreen shows of a tile's events: how many, and the latest. Kept apart from
//the tiles themselves (whose `events` stay empty in homescreen state): the tiles live in a
//SharedValue, and thousands of Date objects there crash the worklets runtime — Date isn't
//a type worklets can carry over to the UI thread.
export type TileEventStats = Map<number, { count: number, lastAt: Date }>

export type HS3Element = HS3Item | HS3Folder

//a homescreen-item is just a placement — position/size + which library tile it shows.
//name/color/data live on the referenced Tile (see db-mock's tiles list), not here, so
//the same tile can be placed via multiple items without duplicating its data.
export type HS3Item = {
    itemId: number,
    tileId: number,
    //set when this item was put here by a routine-linked folder's sync (the routine's id) —
    //only those are removed again when their tile leaves the routine. Items added by hand
    //into a linked folder don't have it and are left alone.
    syncedFromRoutine?: number,
} & HS3Layout;
export type HS3Folder = {
    folderId: number,
    name: string,
    color: string,
    items: HS3Item[]
    //live link to a routine: name, color and the routine's tiles follow it (see
    //crud/routine_folders.ts). Undefined for a normal folder.
    routineId?: number,
} & HS3Layout;
export type HS3Layout = {
    layout: HS3LayoutParams;
    parentId?: number;
}

export type HS3LayoutParams = GridPoint & {
    width: number;
    height: number;
}

export enum Dirs {
    moveLeft = "moveLeft",
    moveRight = "moveRight",
    moveUp = "moveUp",
    moveDown = "moveDown",
}

export type DragState = {
    element: HS3Element,
    coordinate: PixelPoint
    type: "drag" | "resize" | "create"
    //resize only: the edge being dragged — overlapped elements get pushed away in that direction
    resizeEdge?: 'top' | 'bottom' | 'left' | 'right'
}

export type FolderDisplayLevel = {
    main: HS3Folder,
    more: HS3Folder[],
}

export type HomescreenState = "default" | "edit"