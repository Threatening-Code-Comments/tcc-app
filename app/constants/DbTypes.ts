export type LayoutInfos = {
    posX: number
    posY: number
    spanX: number
    spanY: number
}


export type Page = {
    id: number
    name: string
}
export type Routine = {
    id: number
    name: string
}
export type Tile = {
    id: number
    name: string
    mode: number
    rootRoutineId: number
    counter?: number
}

export type RoutinePages = {
    pageId: number
    routineId: number
    posX: number
    posY: number
    spanX: number
    spanY: number
}

export type TileOfRoutine = Tile & {
    tileId: number
    routineId: number
} & LayoutInfos

export type TileEvent = {
    tileId: number
    timestamp: Date
    data: string
}

export type DashboardElementType = "Routine" | "Tile" | "Page"
export type ElementType = Page | RoutineOnPage | Tile

export type DashboardEntry = {
    elementId: number
    elementType: DashboardElementType
}

export type DashboardSetting = {
    elementType: DashboardElementType
    elementId: number
    settingsType: string
    settingsValue: string
}

export const isTile = <TElement extends ElementType>(element: TElement): element is TElement & Tile => {
    return "rootRoutineId" in element;
}

export const isRoutineOnPage = <TElement extends ElementType>(element: TElement): element is TElement & RoutineOnPage => {
    return "pageId" in element;
}

export const isPage = <TElement extends ElementType>(element: TElement): element is TElement & Page => {
    return !isTile(element) && !(isRoutineOnPage(element));
}

//---------------- insert types ----------------
export type InsertPage = {
    id?: number,
    name: string
}
export type InsertRoutine = {
    id?: number
    name: string
}

export type InsertTile = {
    id?: number
    name: string
    mode: number
    rootRoutineId: number
}

type InsertRoutinePages = {
    pageId: number
    routineId?: number
} & LayoutInfos

export type InsertTileOfRoutine = InsertTile & {
    tileId?: number
    routineId: number
} & LayoutInfos

//---------------- compound types ----------------
export type TilesOfRoutine = {
    tiles: Array<TileOfRoutine>
}

export type RoutineOnPage = Routine & RoutinePages & RoutineWithTiles
export type InsertRoutineOnPage = InsertRoutine & InsertRoutinePages
export type RoutineWithTiles = Routine & TilesOfRoutine