import {HomescreenSnapshot, HsFolderRow, HsItemRow, HsTileRow, rowsToFolders, toSnapshot} from '@homescreen/persistence/rows';
import {diffById, diffSnapshots, HomescreenDiff, isEmptyDiff} from '@homescreen/persistence/diff';
import {createHomescreenPersister} from '@homescreen/persistence/persister';
import {HS3Folder, Tile} from '@components/homescreen/types';

const folderRow = (id: number, parentId: number | null, name = `f${id}`): HsFolderRow =>
    ({id, parentId, name, color: '#123456', routineId: null, x: 0, y: 0, w: 1, h: 1})
const itemRow = (id: number, parentId: number | null, x = 0): HsItemRow =>
    ({id, tileId: 1, parentId, syncedFromRoutine: null, x, y: 0, w: 1, h: 1})
const tileRow = (id: number, name = `t${id}`): HsTileRow =>
    ({id, name, mode: 0, color: '#000000', rootRoutineId: 1})
const snapshot = (s: Partial<HomescreenSnapshot> = {}): HomescreenSnapshot =>
    ({folders: [], items: [], tiles: [], ...s})

describe('toSnapshot', () => {
    const tile: Tile = {id: 1, name: 't', mode: 0, color: '#000000', rootRoutineId: 1, events: [{tileId: 1, timestamp: new Date(0), data: 'x'}]}

    it('skips the root level and takes an item\'s parent from the folder holding it', () => {
        const folders: HS3Folder[] = [
            {folderId: undefined, name: '', color: '#888888', parentId: undefined, layout: undefined, items: [
                {itemId: 1, tileId: 1, parentId: 99, layout: {x: 1, y: 2, width: 1, height: 1}},
            ]},
            {folderId: 3, name: 'f', color: '#111111', parentId: undefined, routineId: 5, layout: {x: 0, y: 0, width: 2, height: 2}, items: [
                {itemId: 2, tileId: 1, parentId: 3, syncedFromRoutine: 5, layout: {x: 0, y: 0, width: 1, height: 1}},
            ]},
        ]
        const s = toSnapshot(folders, [tile])
        expect(s.folders).toEqual([{id: 3, parentId: null, name: 'f', color: '#111111', routineId: 5, x: 0, y: 0, w: 2, h: 2}])
        expect(s.items.map(i => [i.id, i.parentId, i.syncedFromRoutine])).toEqual([[1, null, null], [2, 3, 5]])
        expect(s.tiles).toEqual([{id: 1, name: 't', mode: 0, color: '#000000', rootRoutineId: 1}])
    })

    it('is the exact inverse of rowsToFolders', () => {
        const rows = snapshot({
            folders: [{...folderRow(1, null), routineId: 4}, folderRow(2, 1)],
            items: [itemRow(1, null), {...itemRow(2, 1), syncedFromRoutine: 4}, itemRow(3, 2)],
        })
        expect(toSnapshot(rowsToFolders(rows.folders, rows.items), [])).toEqual(rows)
    })
})

describe('diffSnapshots', () => {
    it('finds new, changed and removed rows, and ignores unchanged ones', () => {
        const d = diffById([tileRow(1), tileRow(2), tileRow(3)], [tileRow(1), tileRow(2, 'renamed'), tileRow(4)])
        expect(d.upserts.map(t => t.id)).toEqual([2, 4])
        expect(d.deletes).toEqual([3])
    })

    it('is empty when nothing changed', () => {
        const s = snapshot({folders: [folderRow(1, null)], items: [itemRow(1, 1)], tiles: [tileRow(1)]})
        expect(isEmptyDiff(diffSnapshots(s, structuredClone(s)))).toBe(true)
    })

    it('orders folder upserts parents first and folder deletes children first', () => {
        const prev = snapshot({folders: [folderRow(1, null), folderRow(2, 1), folderRow(3, 2)]})
        const next = snapshot({folders: [folderRow(12, 11), folderRow(11, 10), folderRow(10, null)]})
        const d = diffSnapshots(prev, next)
        expect(d.folders.upserts.map(f => f.id)).toEqual([10, 11, 12])
        expect(d.folders.deletes).toEqual([3, 2, 1])
    })
})

describe('createHomescreenPersister', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    const setup = (write: (diff: HomescreenDiff) => void = () => {}) => {
        let current = snapshot({tiles: [tileRow(1)]})
        const writes: HomescreenDiff[] = []
        const p = createHomescreenPersister({
            initial: current,
            read: () => current,
            write: diff => { write(diff); writes.push(diff) },
            debounceMs: 500,
            onError: () => {},
        })
        return {p, writes, set: (s: HomescreenSnapshot) => { current = s }}
    }

    it('writes once after changes settle, not per change', () => {
        const {p, writes, set} = setup()
        set(snapshot({tiles: [tileRow(1), tileRow(2)]})); p.markDirty()
        jest.advanceTimersByTime(300)
        set(snapshot({tiles: [tileRow(1), tileRow(2), tileRow(3)]})); p.markDirty()
        jest.advanceTimersByTime(300)
        expect(writes).toHaveLength(0)
        jest.advanceTimersByTime(200)
        expect(writes).toHaveLength(1)
        expect(writes[0].tiles.upserts.map(t => t.id)).toEqual([2, 3])
    })

    it('diffs against the last write, and skips empty diffs', () => {
        const {p, writes, set} = setup()
        set(snapshot({tiles: [tileRow(1), tileRow(2)]})); p.flush()
        p.markDirty(); jest.advanceTimersByTime(500)
        expect(writes).toHaveLength(1)
        set(snapshot({tiles: [tileRow(2)]})); p.flush()
        expect(writes[1].tiles).toEqual({upserts: [], deletes: [1]})
    })

    it('flush writes immediately and cancels the pending timer', () => {
        const {p, writes, set} = setup()
        set(snapshot({tiles: []})); p.markDirty()
        p.flush()
        expect(writes).toHaveLength(1)
        jest.advanceTimersByTime(1000)
        expect(writes).toHaveLength(1)
    })

    it('keeps the old baseline after a failed write, so the next flush retries', () => {
        let fail = true
        const {p, writes, set} = setup(() => { if (fail) throw new Error('disk full') })
        set(snapshot({tiles: []}))
        p.flush()
        expect(writes).toHaveLength(0)
        fail = false
        p.flush()
        expect(writes).toHaveLength(1)
        expect(writes[0].tiles.deletes).toEqual([1])
    })

    it('dispose flushes only when something is pending', () => {
        const {p, writes, set} = setup()
        p.dispose()
        expect(writes).toHaveLength(0)
        set(snapshot({tiles: []})); p.markDirty()
        p.dispose()
        expect(writes).toHaveLength(1)
    })
})
