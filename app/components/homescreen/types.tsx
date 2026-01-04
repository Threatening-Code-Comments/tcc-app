import {PlacementGrid} from "./placementGrid";

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

export type HS3Element = HS3Item | HS3Folder

export type HS3Item = {
    itemId: number,
    name: string
} & HS3Layout;
export type HS3Folder = {
    folderId: number,
    name: string,
    items: HS3Item[]
} & HS3Layout;
export type HS3Layout = {
    layout: HS3LayoutParams;
    parentId?: number;
}

export type HS3LayoutParams = GridPoint & {
    width: number;
    height: number;
}

export type DragState = {
    coordinate: PixelPoint
    draggingItem: HS3Item
}

export enum Dirs {
    moveLeft = "moveLeft",
    moveRight = "moveRight",
    moveUp = "moveUp",
    moveDown = "moveDown",
}