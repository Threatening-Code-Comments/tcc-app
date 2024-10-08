export const pagesStatements = {
    create: `CREATE TABLE IF NOT EXISTS pages (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
        );`,
    findAll: `SELECT * FROM pages`,
    name: 'pages'
}

export const routinesStatements = {
    create: `CREATE TABLE IF NOT EXISTS routines (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
        );`,
    findAll: `SELECT * FROM routines`,
    update: `UPDATE routines SET name = ? WHERE id = ?`,
    delete: `DELETE FROM routines WHERE id = ?`,
    name: 'routines'
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
    findAll: `SELECT * FROM page_routines`,
    name: 'page_routines'
}

export const tilesStatements = {
    create: `CREATE TABLE IF NOT EXISTS tiles (
        id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mode INTEGER NOT NULL,
        rootRoutineId INTEGER NOT NULL,
        FOREIGN KEY (rootRoutineId) REFERENCES routines(id)
    );`,
    findAll: `SELECT * FROM tiles`,
    name: 'tiles'
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
    );`,
    findAll: `SELECT * FROM routine_tiles`,
    name: 'routine_tiles'
}

export const tileEventsStatements = {
    create: `CREATE TABLE IF NOT EXISTS tile_events (
        eventId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        tileId INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (tileId) REFERENCES tiles(id)
    );`,
    findAll: `SELECT * FROM tile_events`,
    name: 'tile_events'
}

export const dashboardStatements = {
    create: `CREATE TABLE IF NOT EXISTS dashboard (
        elementId INTEGER NOT NULL,
        elementType TEXT NOT NULL,
        posX INTEGER NOT NULL,
        posY INTEGER NOT NULL,
        spanX INTEGER NOT NULL,
        spanY INTEGER NOT NULL,
        PRIMARY KEY(elementId, elementType)
    );`,
    findAll: `SELECT * FROM dashboard`,
    name: 'dashboard'
}

export const dashboardSettingsStatements = {
    create: `CREATE TABLE IF NOT EXISTS dashboard_settings (
        elementId INTEGER NOT NULL,
        elementType TEXT NOT NULL,
        settingsType TEXT NOT NULL,
        settingsValue TEXT NOT NULL,
        FOREIGN KEY(elementId, elementType) REFERENCES dashboard(elementId, elementType)
    );`,
    findAll: `SELECT * FROM dashboard_settings`,
    name: 'dashboard_settings'
}