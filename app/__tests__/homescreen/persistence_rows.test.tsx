import {HsFolderRow, HsItemRow, rowsToFolders} from '@homescreen/persistence/rows';

const folderRow = (id: number, parentId: number | null, routineId: number | null = null): HsFolderRow =>
    ({id, parentId, name: `f${id}`, color: '#123456', routineId, x: 1, y: 2, w: 3, h: 4})
const itemRow = (id: number, tileId: number, parentId: number | null, syncedFromRoutine: number | null = null): HsItemRow =>
    ({id, tileId, parentId, syncedFromRoutine, x: id, y: 0, w: 1, h: 1})

describe('rowsToFolders', () => {
    it('always yields the root level first, even without any rows', () => {
        const folders = rowsToFolders([], [])
        expect(folders).toHaveLength(1)
        expect(folders[0].folderId).toBeUndefined()
        expect(folders[0].items).toEqual([])
    })

    it('puts parentId-null items on the root and the rest into their folder', () => {
        const folders = rowsToFolders(
            [folderRow(2, null), folderRow(5, 2)],
            [itemRow(3, 30, 5), itemRow(1, 10, null), itemRow(2, 20, 2)],
        )
        expect(folders.map(f => f.folderId)).toEqual([undefined, 2, 5])
        expect(folders[0].items.map(i => i.itemId)).toEqual([1])
        expect(folders[0].items[0].parentId).toBeUndefined()
        expect(folders[1].parentId).toBeUndefined()
        expect(folders[1].items).toEqual([{itemId: 2, tileId: 20, parentId: 2, layout: {x: 2, y: 0, width: 1, height: 1}}])
        expect(folders[2].parentId).toBe(2)
        expect(folders[2].layout).toEqual({x: 1, y: 2, width: 3, height: 4})
    })

    it('carries routine links only where set', () => {
        const [, linked, plain] = rowsToFolders(
            [folderRow(1, null, 7), folderRow(2, null)],
            [itemRow(1, 10, 1, 7), itemRow(2, 11, 1)],
        )
        expect(linked.routineId).toBe(7)
        expect('routineId' in plain).toBe(false)
        expect(linked.items[0].syncedFromRoutine).toBe(7)
        expect('syncedFromRoutine' in linked.items[1]).toBe(false)
    })

    it('orders folders and items by id regardless of row order', () => {
        const folders = rowsToFolders(
            [folderRow(9, null), folderRow(4, null)],
            [itemRow(8, 1, null), itemRow(3, 1, null)],
        )
        expect(folders.map(f => f.folderId)).toEqual([undefined, 4, 9])
        expect(folders[0].items.map(i => i.itemId)).toEqual([3, 8])
    })
})
