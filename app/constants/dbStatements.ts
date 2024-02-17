import { TileOfRoutine } from "./DbTypes"

export const pagesStatements = {
    create: `CREATE TABLE IF NOT EXISTS pages (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
        );`,
    findAll: `SELECT * FROM pages`
}

export const routinesStatements = {
    create: `CREATE TABLE IF NOT EXISTS routines (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
        );`,
    findAll: `SELECT * FROM routines`
}

export const pageRoutinesStatements = {
    create: `CREATE TABLE IF NOT EXISTS page_routines (
        pageId INTEGER NOT NULL,
        routineId INTEGER NOT NULL,
        posX INTEGER NOT NULL,
        posY INTEGER NOT NULL,
        spanX INTEGER NOT NULL,
        spanY INTEGER NOT NULL,
        CONSTRAINT PK_pageRoutines PRIMARY KEY (pageId,routineId),
        FOREIGN KEY (pageId) REFERENCES pages(id),
        FOREIGN KEY (routineId) REFERENCES routines(id)
    );`,
    findAll: `SELECT * FROM page_routines`
}

export const tilesStatements = {
    create: `CREATE TABLE IF NOT EXISTS tiles (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mode INTEGER NOT NULL,
        rootRoutineId INTEGER NOT NULL,
        FOREIGN KEY (rootRoutineId) REFERENCES routines(id)
    );`
}

export const routineTilesStatements = {
    create: `CREATE TABLE IF NOT EXISTS routine_tiles (
        tileId INTEGER NOT NULL,
        routineId INTEGER NOT NULL,
        posX INTEGER NOT NULL,
        posY INTEGER NOT NULL,
        spanX INTEGER NOT NULL,
        spanY INTEGER NOT NULL,
        CONSTRAINT PK_routineTiles PRIMARY KEY (tileId,routineId),
        FOREIGN KEY (tileId) REFERENCES tiles(id),
        FOREIGN KEY (routineId) REFERENCES routines(id)
    );`
}

export const tileEventsStatements = {
    create: `CREATE TABLE IF NOT EXISTS tile_events (
        eventId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        tileId INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (tileId) REFERENCES tiles(id)
    );`
}