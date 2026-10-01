import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * The real homescreen repository + writer (drizzle's expo-sqlite driver included) against a
 * copy of a real prod backup: runs the app's migrations on it like a fresh import would,
 * loads, plays through a session of edits and checks everything comes back after a reload.
 *
 * expo-sqlite is swapped for a thin shim over node's built-in sqlite, so this needs
 * Node >= 22.5. The backup is personal data and lives in local-data/ (gitignored) — without
 * one (fresh clone, CI) the whole suite is skipped. TCC_PROD_DB points at a specific file.
 */

const repoRoot = path.resolve(__dirname, '../../..')
const findBackup = (): string | undefined => {
    if (process.env.TCC_PROD_DB) return process.env.TCC_PROD_DB
    const dir = path.join(repoRoot, 'local-data')
    if (!fs.existsSync(dir)) return undefined
    const backups = fs.readdirSync(dir).filter(f => /^tcc-backup-.*\.db$/.test(f)).sort()
    return backups.length ? path.join(dir, backups[backups.length - 1]) : undefined
}
const nodeSqlite = (process as any).getBuiltinModule?.('node:sqlite')
const backup = findBackup()
const runnable = !!backup && !!nodeSqlite

const mockDbCopy = path.join(os.tmpdir(), `tcc-prod-db-test-${process.pid}.db`)
//connections the shim opened — closed before the copy is removed (Windows keeps open files locked)
const mockOpenDbs: { close: () => void }[] = []

jest.mock('expo-sqlite', () => {
    const {DatabaseSync} = (process as any).getBuiltinModule('node:sqlite')
    const {dbName} = jest.requireActual('../../constants/global')
    //the subset of expo-sqlite's sync API that drizzle's expo driver uses
    const openDatabaseSync = (name: string) => {
        const db = new DatabaseSync(name === dbName ? mockDbCopy : ':memory:')
        mockOpenDbs.push(db)
        return {
            prepareSync: (sql: string) => {
                const stmt = db.prepare(sql)
                const execute = (params: unknown[]) => {
                    let ran: { changes: number, lastInsertRowid: number } | undefined
                    const run = () => ran ??= stmt.run(...params)
                    return {
                        get changes() { return run().changes },
                        get lastInsertRowId() { return run().lastInsertRowid },
                        getAllSync: () => stmt.all(...params),
                        getFirstSync: () => stmt.get(...params) ?? null,
                    }
                }
                return {
                    executeSync: execute,
                    executeForRawResultSync: (params: unknown[]) => ({
                        getAllSync: () => stmt.all(...params).map((row: object) => Object.values(row)),
                    }),
                }
            },
            execSync: (sql: string) => db.exec(sql),
            closeSync: () => db.close(),
        }
    }
    return {openDatabaseSync, default: {openDatabaseSync}}
})

//the migrations as drizzle/migrations.js hands them to useMigrations (there the .sql files
//are inlined by babel; here they're read from disk)
const migrationsConfig = () => {
    const dir = path.join(repoRoot, 'drizzle')
    const journal = JSON.parse(fs.readFileSync(path.join(dir, 'meta/_journal.json'), 'utf-8'))
    const migrations: Record<string, string> = {}
    for (const e of journal.entries)
        migrations[`m${String(e.idx).padStart(4, '0')}`] = fs.readFileSync(path.join(dir, `${e.tag}.sql`), 'utf-8')
    return {journal, migrations}
}

const describeProd = runnable ? describe : describe.skip

describeProd('homescreen persistence on a real prod backup', () => {
    let m: {
        db: typeof import('@db/database'),
        repo: typeof import('@homescreen/db'),
        writer: typeof import('@homescreen/persistence/writer'),
        rows: typeof import('@homescreen/persistence/rows'),
        diff: typeof import('@homescreen/persistence/diff'),
        schema: typeof import('@db/schema'),
    }
    let counts: Record<string, number>

    beforeAll(async () => {
        fs.copyFileSync(backup!, mockDbCopy)
        m = {
            db: require('@db/database'),
            repo: require('@homescreen/db'),
            writer: require('@homescreen/persistence/writer'),
            rows: require('@homescreen/persistence/rows'),
            diff: require('@homescreen/persistence/diff'),
            schema: require('@db/schema'),
        }
        const probe = new nodeSqlite.DatabaseSync(mockDbCopy)
        counts = Object.fromEntries(['pages', 'routines', 'tiles', 'tile_events'].map(t =>
            [t, probe.prepare(`select count(*) n from ${t}`).get().n]))
        //what migration 0003 should carry over into the homescreen (entries whose element exists)
        for (const [type, table] of [['Tile', 'tiles'], ['Routine', 'routines'], ['Page', 'pages']])
            counts[`dashboard${type}`] = probe.prepare(
                `select count(*) n from dashboard where elementType = '${type}' and elementId in (select id from ${table})`).get().n
        probe.close()

        const {migrate} = require('drizzle-orm/expo-sqlite/migrator')
        await migrate(m.db.db(), migrationsConfig())
    })
    afterAll(() => {
        mockOpenDbs.forEach(db => db.close())
        fs.rmSync(mockDbCopy, {force: true})
    })

    it('migrates the backup: library untouched, old dashboard carried over into the homescreen', async () => {
        const {schema, db} = m
        const folders = await db.db().select().from(schema.hsFolders)
        const items = await db.db().select().from(schema.hsItems)
        console.log(`dashboard -> homescreen: ${items.length} items, ${folders.length} folders`)
        expect(items.length).toBe(counts.dashboardTile)
        //on the root: a linked folder per dashboard routine and a folder per dashboard page
        expect(folders.filter(f => f.parentId === null).length).toBe(counts.dashboardRoutine + counts.dashboardPage)
        expect((await db.db().select().from(schema.pages)).length).toBe(counts.pages)
        expect((await db.db().select().from(schema.routines)).length).toBe(counts.routines)
        expect((await db.db().select().from(schema.tiles)).length).toBe(counts.tiles)
    })

    it('loads the full library quickly, with the carried-over homescreen', async () => {
        const t0 = Date.now()
        const [folders, tiles, routines, stats] = await Promise.all([
            m.repo.getFoldersFromDb(), m.repo.getTilesFromDb(), m.repo.getRoutinesFromDb(), m.repo.getTileEventStatsFromDb(),
        ])
        const ms = Date.now() - t0
        const eventTotal = [...stats.values()].reduce((n, s) => n + s.count, 0)
        console.log(`prod load: ${tiles.length} tiles, ${eventTotal} events (as ${stats.size} per-tile stats), ${routines.length} routines in ${ms} ms`)

        expect(tiles.length).toBe(counts.tiles)
        //no events in the tiles list — Date objects there crash the worklets runtime
        expect(tiles.every(t => t.events.length === 0)).toBe(true)
        expect(eventTotal).toBe(counts.tile_events)
        expect([...stats.values()].every(s => s.lastAt instanceof Date && !isNaN(s.lastAt.getTime()) && s.lastAt.getFullYear() > 2020)).toBe(true)
        expect(routines.length).toBe(counts.routines)
        expect(folders[0].folderId).toBeUndefined()
        expect(folders[0].items.length).toBe(counts.dashboardTile)
        expect(ms).toBeLessThan(2000)
    })

    it('a session of edits survives a reload, and deleting a tile takes its events along', async () => {
        const {repo, writer, rows, diff} = m
        const {createFolder} = require('@homescreen/crud/createTileOrFolder')
        const {syncRoutineFolders} = require('@homescreen/crud/routine_folders')
        const {deleteElement} = require('@homescreen/crud/delete_elements')

        let tiles = await repo.getTilesFromDb()
        const routines = await repo.getRoutinesFromDb()
        let memory = await repo.getFoldersFromDb()
        let persisted = rows.toSnapshot(memory, tiles)
        const save = () => {
            const current = rows.toSnapshot(memory, tiles)
            writer.writeHomescreenDiff(diff.diffSnapshots(persisted, current))
            persisted = current
        }

        //every tile placed on the root in one go — the biggest single write a user can cause
        memory = [{...memory[0], items: tiles.map((t, i) => ({
            itemId: i, tileId: t.id, parentId: undefined, layout: {x: i % 4, y: Math.floor(i / 4), width: 1, height: 1},
        }))}]
        const t0 = Date.now()
        save()
        console.log(`writing ${tiles.length} placements: ${Date.now() - t0} ms`)

        //two of them into a new folder, then a routine-linked folder synced from the biggest routine
        memory = createFolder(memory[0].items.slice(0, 2), memory, undefined, {x: 0, y: 0, width: 1, height: 1})
        const biggest = routines
            .map(r => ({r, n: tiles.filter(t => t.rootRoutineId === r.id).length}))
            .sort((a, b) => b.n - a.n)[0].r
        const linkedId = Math.max(...memory.filter(f => f.folderId !== undefined).map(f => f.folderId)) + 1
        memory = [...memory, {folderId: linkedId, name: '', color: '#000000', parentId: undefined, routineId: biggest.id, layout: {x: 1, y: 0, width: 1, height: 1}, items: []}]
        memory = syncRoutineFolders(memory, tiles, routines) ?? memory
        save()

        //a tile deleted in the App Drawer (with its placements), and an item removed by hand
        const statsBefore = await repo.getTileEventStatsFromDb()
        const doomed = tiles.find(t => statsBefore.has(t.id) && t.rootRoutineId !== biggest.id)
        memory = memory.map(f => ({...f, items: f.items.filter(i => i.tileId !== doomed.id)}))
        tiles = tiles.filter(t => t.id !== doomed.id)
        memory = deleteElement(memory[0].items[5], memory)
        save()

        const [reloadedFolders, reloadedTiles, statsAfter] = await Promise.all([repo.getFoldersFromDb(), repo.getTilesFromDb(), repo.getTileEventStatsFromDb()])
        const normalize = (f: typeof memory) => rows.rowsToFolders(rows.toSnapshot(f, []).folders, rows.toSnapshot(f, []).items)
        expect(reloadedFolders).toEqual(normalize(memory))
        expect(reloadedTiles.map(t => t.id)).toEqual(tiles.map(t => t.id))
        expect(statsAfter.has(doomed.id)).toBe(false)
        expect([...statsAfter.values()].reduce((n, s) => n + s.count, 0)).toBe(counts.tile_events - statsBefore.get(doomed.id).count)
        expect(reloadedFolders.find(f => f.routineId === biggest.id).items.length)
            .toBe(tiles.filter(t => t.rootRoutineId === biggest.id).length)
        expect(syncRoutineFolders(reloadedFolders, reloadedTiles, routines)).toBeUndefined()
    })
})
