import {syncRoutineFolder, syncRoutineFolders, isManagedByRoutine} from '@homescreen/crud/routine_folders';
import {HS3Folder, Routine, Tile} from '@components/homescreen/types';

const tile = (id: number, rootRoutineId: number): Tile =>
    ({id, name: `t${id}`, mode: 0, rootRoutineId, color: '#000', events: []})

const routines: Routine[] = [{id: 1, name: 'Konsum', color: '#f00'}]
const root: HS3Folder = {folderId: undefined, name: 'root', color: '#fff', items: [], layout: {x: 0, y: 0, width: 4, height: 6}}
const linked = (items: HS3Folder['items'] = []): HS3Folder =>
    ({folderId: 1, name: 'old', color: '#00f', items, routineId: 1, parentId: undefined, layout: {x: 0, y: 0, width: 1, height: 1}})

describe('routine-linked folders', () => {
    it('fills an empty linked folder with the routine tiles and takes over name/color', () => {
        const synced = syncRoutineFolder(linked(), [root], [tile(10, 1), tile(11, 1), tile(12, 0)], routines)
        expect(synced.name).toBe('Konsum')
        expect(synced.color).toBe('#f00')
        expect(synced.items.map(i => i.tileId)).toEqual([10, 11])
        expect(synced.items.every(i => i.syncedFromRoutine === 1 && i.parentId === 1)).toBe(true)
        expect(synced.items[0].layout).not.toEqual(synced.items[1].layout)
    })

    it('adds new routine tiles, drops ones that left, keeps hand-placed items and layout', () => {
        const folder = linked([
            {itemId: 0, tileId: 10, parentId: 1, layout: {x: 2, y: 1, width: 1, height: 1}, syncedFromRoutine: 1},
            {itemId: 1, tileId: 11, parentId: 1, layout: {x: 0, y: 0, width: 1, height: 1}, syncedFromRoutine: 1},
            {itemId: 2, tileId: 99, parentId: 1, layout: {x: 1, y: 0, width: 1, height: 1}},
        ])
        //11 left the routine, 13 joined
        const synced = syncRoutineFolder(folder, [root, folder], [tile(10, 1), tile(11, 0), tile(13, 1), tile(99, 0)], routines)

        expect(synced.items.map(i => i.tileId)).toEqual([10, 99, 13])
        expect(synced.items[0].layout).toEqual({x: 2, y: 1, width: 1, height: 1})
        expect(synced.items[2].itemId).toBe(3)
        expect(synced.items[2].layout).toEqual({x: 0, y: 0, width: 1, height: 1})
    })

    it('unlinks the folder when the routine is gone', () => {
        const synced = syncRoutineFolder(linked(), [root], [], [])
        expect(synced.routineId).toBeUndefined()
    })

    it('reports no change once in sync, so a reaction on folders does not loop', () => {
        const tiles = [tile(10, 1)]
        const first = syncRoutineFolders([root, linked()], tiles, routines)
        expect(first).toBeDefined()
        expect(syncRoutineFolders(first!, tiles, routines)).toBeUndefined()
    })

    it('treats only sync-added items in their own linked folder as routine-managed', () => {
        const folders = syncRoutineFolders([root, linked()], [tile(10, 1)], routines)!
        const item = folders[1].items[0]
        expect(isManagedByRoutine(item, folders)).toBe(true)
        expect(isManagedByRoutine({...item, parentId: undefined}, folders)).toBe(false)
        expect(isManagedByRoutine({...item, syncedFromRoutine: undefined}, folders)).toBe(false)
    })
})
