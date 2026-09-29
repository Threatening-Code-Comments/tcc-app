import {HomescreenSnapshot, rowsToFolders, toSnapshot} from '@homescreen/persistence/rows';
import {diffSnapshots, HomescreenDiff} from '@homescreen/persistence/diff';
import {deleteElement} from '@homescreen/crud/delete_elements';
import {addToNewFolder, createFolder} from '@homescreen/crud/createTileOrFolder';
import {moveElementsToFolder} from '@homescreen/crud/move_elements';
import {syncRoutineFolders} from '@homescreen/crud/routine_folders';
import {HS3Folder, Routine, Tile} from '@components/homescreen/types';

/**
 * "Survives a restart": run a real crud operation, persist the diff into a stand-in
 * database with the writer's semantics (upsert by id, delete by id), load it back through
 * rowsToFolders and compare with what was in memory before the "restart".
 */

//stand-in for writeHomescreenDiff: same outcome on plain row lists
function applyDiff(db: HomescreenSnapshot, diff: HomescreenDiff): HomescreenSnapshot {
    const apply = <T extends { id: number }>(rows: T[], d: { upserts: T[], deletes: number[] }) => {
        const byId = new Map(rows.map(r => [r.id, r]))
        d.upserts.forEach(r => byId.set(r.id, r))
        d.deletes.forEach(id => byId.delete(id))
        return [...byId.values()]
    }
    return {folders: apply(db.folders, diff.folders), items: apply(db.items, diff.items), tiles: apply(db.tiles, diff.tiles)}
}

//persists the change from `before` to `after` on top of a db holding `before`, then reloads
function persistAndReload(before: HS3Folder[], after: HS3Folder[], tilesBefore: Tile[] = tiles, tilesAfter: Tile[] = tilesBefore) {
    const dbBefore = toSnapshot(before, tilesBefore)
    const db = applyDiff(dbBefore, diffSnapshots(dbBefore, toSnapshot(after, tilesAfter)))
    return {db, reloaded: rowsToFolders(db.folders, db.items)}
}

//folder list in load order (root first, then by id) with items by id — what a reload yields
const normalize = (folders: HS3Folder[]) => rowsToFolders(toSnapshot(folders, []).folders, toSnapshot(folders, []).items)

//crud functions mutate the elements they're handed — every test starts from a fresh copy
const clone = <T, >(x: T): T => structuredClone(x)

const tile = (id: number, rootRoutineId = 1): Tile => ({id, name: `t${id}`, mode: 0, color: '#000000', rootRoutineId, events: []})
const tiles = [tile(10), tile(11), tile(12), tile(13, 2)]
const routines: Routine[] = [{id: 1, name: 'Konsum', color: '#ff0000'}, {id: 2, name: 'Schlaf', color: '#0000ff'}]

const start = (): HS3Folder[] => clone([
    {folderId: undefined, name: '', color: '#888888', parentId: undefined, layout: undefined, items: [
        {itemId: 0, tileId: 10, parentId: undefined, layout: {x: 0, y: 0, width: 1, height: 1}},
        {itemId: 1, tileId: 11, parentId: undefined, layout: {x: 1, y: 0, width: 2, height: 1}},
    ]},
    {folderId: 0, name: 'Ordner', color: '#00ff00', parentId: undefined, layout: {x: 0, y: 1, width: 1, height: 1}, items: [
        {itemId: 2, tileId: 12, parentId: 0, layout: {x: 0, y: 0, width: 1, height: 1}},
    ]},
    {folderId: 1, name: 'Unterordner', color: '#0000ff', parentId: 0, layout: {x: 1, y: 0, width: 1, height: 1}, items: [
        {itemId: 3, tileId: 10, parentId: 1, layout: {x: 0, y: 0, width: 1, height: 1}},
    ]},
])

describe('homescreen survives a restart', () => {
    it('unchanged state loads back identical', () => {
        const s = start()
        expect(persistAndReload(s, s).reloaded).toEqual(normalize(s))
    })

    it('moving and resizing an item', () => {
        const before = start()
        const after = before.map(f => f.folderId !== undefined ? f : {
            ...f, items: f.items.map(i => i.itemId === 1 ? {...i, layout: {x: 2, y: 3, width: 2, height: 2}} : i),
        })
        const {reloaded} = persistAndReload(before, after)
        expect(reloaded).toEqual(normalize(after))
        expect(reloaded[0].items[1].layout).toEqual({x: 2, y: 3, width: 2, height: 2})
    })

    it('deleting an item', () => {
        const before = start()
        const after = deleteElement(before[0].items[0], before)
        expect(persistAndReload(before, after).reloaded).toEqual(normalize(after))
    })

    it('deleting a folder takes its whole subtree along', () => {
        const before = start()
        const after = deleteElement(before[1], before)
        const {db, reloaded} = persistAndReload(before, after)
        expect(reloaded).toEqual(normalize(after))
        expect(db.folders).toEqual([])
        expect(db.items.map(i => i.id).sort()).toEqual([0, 1])
    })

    it('dropping an item onto another creates a folder holding both', () => {
        const before = start()
        const [a, b] = clone(before[0].items)
        const after = addToNewFolder(a, b, clone(before), undefined)
        const {reloaded} = persistAndReload(before, after)
        expect(reloaded).toEqual(normalize(after))
        const created = reloaded.find(f => f.name === 'New Folder')
        expect(created.items.map(i => i.itemId).sort()).toEqual([0, 1])
        expect(reloaded[0].items).toEqual([])
    })

    it('the very first folder (only the root level exists yet) gets a real id', () => {
        const before: HS3Folder[] = [clone(start()[0])]
        const [a, b] = clone(before[0].items)
        const after = createFolder([a, b], clone(before), undefined, {x: 0, y: 0, width: 1, height: 1})
        const created = after.find(f => f.folderId !== undefined)
        expect(Number.isInteger(created.folderId)).toBe(true)
        expect(persistAndReload(before, after).reloaded).toEqual(normalize(after))
    })

    it('moving an item and a folder into another folder', () => {
        const before = start()
        const target = clone(before[1])
        const after = moveElementsToFolder([clone(before[0].items[1])], clone(before), target)
        const {reloaded} = persistAndReload(before, after)
        expect(reloaded).toEqual(normalize(after))
        expect(reloaded.find(f => f.folderId === 0).items.map(i => i.itemId)).toEqual([1, 2])
    })

    it('routine-linked folder: link, sync, and the synced items keep their origin', () => {
        const before = start()
        const linked = before.map(f => f.folderId === 1 ? {...f, routineId: 2} : f)
        const after = syncRoutineFolders(linked, tiles, routines)
        const {reloaded} = persistAndReload(before, after)
        expect(reloaded).toEqual(normalize(after))
        const folder = reloaded.find(f => f.folderId === 1)
        expect(folder.routineId).toBe(2)
        expect(folder.name).toBe('Schlaf')
        expect(folder.items.find(i => i.tileId === 13).syncedFromRoutine).toBe(2)
        //nothing left to sync after a reload
        expect(syncRoutineFolders(reloaded, tiles, routines)).toBeUndefined()
    })

    it('deleting a tile in the App Drawer removes it and all its placements', () => {
        const before = start()
        const after = before.map(f => ({...f, items: f.items.filter(i => i.tileId !== 10)}))
        const {db, reloaded} = persistAndReload(before, after, tiles, tiles.filter(t => t.id !== 10))
        expect(reloaded).toEqual(normalize(after))
        expect(db.tiles.map(t => t.id)).not.toContain(10)
        expect(db.items.some(i => i.tileId === 10)).toBe(false)
    })

    it('creating a tile (uncategorized) together with its placement', () => {
        const before = start()
        const newTile = tile(14, 0)
        const after = before.map(f => f.folderId !== undefined ? f : {
            ...f, items: [...f.items, {itemId: 4, tileId: 14, parentId: undefined, layout: {x: 3, y: 0, width: 1, height: 1}}],
        })
        const {db, reloaded} = persistAndReload(before, after, tiles, [...tiles, newTile])
        expect(reloaded).toEqual(normalize(after))
        expect(db.tiles.find(t => t.id === 14)).toEqual({id: 14, name: 't14', mode: 0, color: '#000000', rootRoutineId: 0})
    })

    it('several edits in a row, persisted one after another, add up', () => {
        let memory = start()
        let db = toSnapshot(memory, tiles)
        const step = (next: HS3Folder[]) => {
            db = applyDiff(db, diffSnapshots(toSnapshot(memory, tiles), toSnapshot(next, tiles)))
            memory = next
        }
        step(deleteElement(memory[2], memory))
        step(moveElementsToFolder([clone(memory[0].items[0])], clone(memory), clone(memory[1])))
        step(memory.map(f => f.folderId === 0 ? {...f, name: 'umbenannt'} : f))
        expect(rowsToFolders(db.folders, db.items)).toEqual(normalize(memory))
    })
})
