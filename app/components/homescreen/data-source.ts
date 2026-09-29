import * as realDb from "@components/homescreen/db";
import * as mockDb from "@components/homescreen/db-mock";

//where the homescreen loads its folders/tiles/routines from. "mock" = the in-memory prod
//snapshot in db-mock (nothing is saved, reset on reload); "db" = the app's SQLite database.
//Stays on "mock" until edits are actually written back (persistence step 4) — with "db"
//before that, every change would silently vanish on the next start.
export const HOMESCREEN_DATA_SOURCE = "mock" as "db" | "mock"

const source = HOMESCREEN_DATA_SOURCE === "db" ? realDb : mockDb

export const getFoldersFromDb = source.getFoldersFromDb
export const getTilesFromDb = source.getTilesFromDb
export const getRoutinesFromDb = source.getRoutinesFromDb
