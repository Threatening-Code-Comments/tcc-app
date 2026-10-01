import * as fs from 'fs';
import * as path from 'path';
import {rowsToFolders} from '@homescreen/persistence/rows';
import {syncRoutineFolders} from '@homescreen/crud/routine_folders';
import {Tile} from '@components/homescreen/types';

/**
 * Migration 0003 (old dashboard -> homescreen) on real sqlite (node's built-in, Node >= 22.5):
 * the migrations up to 0002 build an old-style database, a dashboard gets filled in, then
 * 0003 runs exactly as the app's migrator would run it.
 */

const nodeSqlite = (process as any).getBuiltinModule?.('node:sqlite')
const drizzleDir = path.resolve(__dirname, '../../../drizzle')
const journal = JSON.parse(fs.readFileSync(path.join(drizzleDir, 'meta/_journal.json'), 'utf-8'))

const runMigration = (db: any, tag: string) => {
    for (const stmt of fs.readFileSync(path.join(drizzleDir, `${tag}.sql`), 'utf-8').split('--> statement-breakpoint'))
        if (stmt.trim()) db.exec(stmt)
}
const tagOf = (prefix: string) => journal.entries.find((e: any) => e.tag.startsWith(prefix)).tag

//a database migrated up to 0002 with: page 1 (routines 10, 11), page 2 (routine 20),
//tiles 100/101 in routine 10, 102 in routine 11, 103 in routine 20
function oldDatabase() {
    const db = new nodeSqlite.DatabaseSync(':memory:')
    for (const prefix of ['0000', '0001', '0002']) runMigration(db, tagOf(prefix))
    db.exec(`
        INSERT INTO pages VALUES (1, 'Lifestyle', '#111111'), (2, 'Work', '#222222');
        INSERT INTO routines VALUES (10, 'Konsum', '#aa0000', 1), (11, 'Sport', '#00aa00', 1), (20, 'Fokus', '#0000aa', 2);
        INSERT INTO tiles VALUES (100, 'Kaffee', 0, '#000001', 10), (101, 'Mate', 0, '#000002', 10),
                                 (102, 'Laufen', 0, '#000003', 11), (103, 'Deep Work', 0, '#000004', 20);
    `)
    return db
}
const addToDashboard = (db: any, entries: [number, string, number][]) => {
    const stmt = db.prepare('INSERT INTO dashboard (elementId, elementType, posX, posY, spanX, spanY, timeAdded) VALUES (?, ?, 0, 0, 0, 0, ?)')
    for (const [id, type, time] of entries) stmt.run(id, type, time)
}
const all = (db: any, sql: string) => db.prepare(sql).all().map((r: object) => ({...r}))
const tables = (db: any) => all(db, "SELECT name FROM sqlite_master WHERE type = 'table'").map((r: any) => r.name)

const describeSqlite = nodeSqlite ? describe : describe.skip

describeSqlite('migration 0003: old dashboard -> homescreen', () => {
    it('turns tiles into items, routines into linked folders and pages into folders of linked routine folders', () => {
        const db = oldDatabase()
        addToDashboard(db, [
            [100, 'Tile', 1000],
            [10, 'Routine', 4000],
            [1, 'Page', 3000],
            [103, 'Tile', 2000],
        ])
        runMigration(db, tagOf('0003'))

        //newest first, one cell each: Routine 10, Page 1, Tile 103, Tile 100
        expect(all(db, 'SELECT * FROM hs_items ORDER BY id')).toEqual([
            {id: 0, tileId: 103, parentId: null, syncedFromRoutine: null, x: 2, y: 0, w: 1, h: 1},
            {id: 1, tileId: 100, parentId: null, syncedFromRoutine: null, x: 3, y: 0, w: 1, h: 1},
        ])
        expect(all(db, 'SELECT id, parentId, name, color, routineId, x, y FROM hs_folders ORDER BY id')).toEqual([
            {id: 0, parentId: null, name: 'Konsum', color: '#aa0000', routineId: 10, x: 0, y: 0},
            {id: 1, parentId: null, name: 'Lifestyle', color: '#111111', routineId: null, x: 1, y: 0},
            {id: 2, parentId: 1, name: 'Konsum', color: '#aa0000', routineId: 10, x: 0, y: 0},
            {id: 3, parentId: 1, name: 'Sport', color: '#00aa00', routineId: 11, x: 1, y: 0},
        ])
        expect(tables(db)).not.toContain('dashboard')
        expect(tables(db)).not.toContain('dashboard_settings')
        expect(tables(db).filter((t: string) => t.startsWith('_hs'))).toEqual([])
    })

    it('loads as a homescreen whose linked folders the routine sync then fills', () => {
        const db = oldDatabase()
        addToDashboard(db, [[10, 'Routine', 2000], [1, 'Page', 1000]])
        runMigration(db, tagOf('0003'))

        const folders = rowsToFolders(all(db, 'SELECT * FROM hs_folders'), all(db, 'SELECT * FROM hs_items'))
        const tiles: Tile[] = all(db, 'SELECT * FROM tiles').map((t: any) => ({...t, events: []}))
        const routines = all(db, 'SELECT id, name, color FROM routines')
        const synced = syncRoutineFolders(folders, tiles, routines)

        const tilesIn = (folderId: number) => synced.find(f => f.folderId === folderId).items.map(i => i.tileId).sort()
        expect(tilesIn(0)).toEqual([100, 101])         //Konsum on the root
        expect(tilesIn(2)).toEqual([100, 101])         //Konsum inside the Lifestyle page
        expect(tilesIn(3)).toEqual([102])              //Sport inside the Lifestyle page
        expect(synced.find(f => f.folderId === 1).items).toEqual([])
    })

    it('skips entries whose element no longer exists', () => {
        const db = oldDatabase()
        addToDashboard(db, [[999, 'Tile', 3000], [100, 'Tile', 2000], [77, 'Routine', 1000]])
        runMigration(db, tagOf('0003'))

        expect(all(db, 'SELECT id, tileId, x FROM hs_items')).toEqual([{id: 0, tileId: 100, x: 0}])
        expect(all(db, 'SELECT * FROM hs_folders')).toEqual([])
    })

    it('leaves a homescreen that already has content alone, but still drops the dashboard', () => {
        const db = oldDatabase()
        db.exec("INSERT INTO hs_items VALUES (5, 102, NULL, NULL, 3, 3, 1, 1)")
        addToDashboard(db, [[100, 'Tile', 1000], [10, 'Routine', 2000]])
        runMigration(db, tagOf('0003'))

        expect(all(db, 'SELECT id, tileId FROM hs_items')).toEqual([{id: 5, tileId: 102}])
        expect(all(db, 'SELECT * FROM hs_folders')).toEqual([])
        expect(tables(db)).not.toContain('dashboard')
    })

    it('an empty dashboard just gets dropped', () => {
        const db = oldDatabase()
        runMigration(db, tagOf('0003'))
        expect(all(db, 'SELECT * FROM hs_items')).toEqual([])
        expect(tables(db)).not.toContain('dashboard')
    })
})
