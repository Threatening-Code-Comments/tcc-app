import { ColumnMapping, IStatement, Repository, columnTypes, sql } from "expo-sqlite-orm"
import { dbName } from "./global"


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
    posX: number
    posY: number
    spanX: number
    spanY: number
}

export type TileEvent = {
    tileId: number
    timestamp: Date
    data: string
}

//insert types
export type InsertPage = {
    id?: number,
    name: string
}
export type InsertRoutine = {
    id?: number
    name: string
}

export type InsertTile={
    id?: number
    name: string
    mode: number
    rootRoutineId: number
}

type InsertRoutinePages = {
    pageId: number
    routineId?: number
    posX: number
    posY: number
    spanX: number
    spanY: number
}

export type InsertTileOfRoutine = InsertTile & {
    tileId?: number
    routineId: number
    posX: number
    posY: number
    spanX: number
    spanY: number
}

//compound types
export type TilesOfRoutine = {
    tiles: Array<TileOfRoutine>
}

export type RoutineOnPage = Routine & RoutinePages & RoutineWithTiles
export type InsertRoutineOnPage = InsertRoutine & InsertRoutinePages
export type RoutineWithTiles = Routine & TilesOfRoutine