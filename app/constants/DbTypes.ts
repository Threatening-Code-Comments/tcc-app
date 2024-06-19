export type LayoutInfos = {
    posX?: number
    posY?: number
    spanX?: number
    spanY?: number
}


export type Page = {
    id: number
    name: string
    color: string
}
export type Routine = {
    id: number
    name: string
    color: string
}
export type Tile = {
    id: number
    name: string
    mode: number
    rootRoutineId: number
    color: string
    events: Array<TileEvent>
}

export type RoutinePages = {
    pageId: number
    routineId: number
    posX?: number
    posY?: number
    spanX?: number
    spanY?: number
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

export enum ElementTypeNames {
    Page = "Page",
    Routine = "Routine",
    Tile = "Tile"
}
// export type DashboardElementType = ElementTypes.Routine | ElementTypes.Tile | ElementTypes.Page
export type ElementType = Page | RoutineOnPage | Tile
export const getElementTypeName = (element: ElementType): ElementTypeNames => {
    return isTile(element) ? ElementTypeNames.Tile : isRoutineOnPage(element) ? ElementTypeNames.Routine : ElementTypeNames.Page;
}

export type DashboardEntry = {
    readonly elementId: number
    readonly elementType: ElementTypeNames
    timeAdded: Date
}

export type DashboardSetting = {
    readonly elementType: ElementTypeNames
    readonly elementId: number
    settingsType: string
    settingsValue: string
}

export const isTile = <TElement extends ElementType>(element: TElement): element is TElement & Tile => {
    return "rootRoutineId" in element;
}

export const isRoutineOnPage = <TElement extends ElementType>(element: TElement): element is TElement & RoutineOnPage => {
    return "tiles" in element;
}

export const isPage = <TElement extends ElementType>(element: TElement): element is TElement & Page => {
    return !isTile(element) && !(isRoutineOnPage(element));
}

function isValidDate(d: Date) {
    return !isNaN(d.getTime());
}

//---------------- insert types ----------------
export type InsertPage = {
    id?: number,
    name: string
    color: string
}
export type InsertRoutine = {
    id?: number
    name: string
    color: string
    rootPageId: number
}

export type InsertTile = {
    id?: number
    name: string
    color: string
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