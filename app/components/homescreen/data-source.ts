import * as realDb from "@components/homescreen/db";
import * as mockDb from "@components/homescreen/db-mock";

//where the homescreen loads its folders/tiles/routines from. "db" = the app's SQLite
//database, and every change is written back (usePersistHomescreen). "mock" = the in-memory
//prod snapshot in db-mock — nothing is saved, reset on reload; handy for tests/demos.
export const HOMESCREEN_DATA_SOURCE = "db" as "db" | "mock"

const source = HOMESCREEN_DATA_SOURCE === "db" ? realDb : mockDb

export const getFoldersFromDb = source.getFoldersFromDb
export const getTilesFromDb = source.getTilesFromDb
export const getRoutinesFromDb = source.getRoutinesFromDb
export const getTileEventStatsFromDb = source.getTileEventStatsFromDb
