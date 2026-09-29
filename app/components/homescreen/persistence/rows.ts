import {HS3Folder, HS3Item, Tile} from "@homescreen/types";

//row shapes of hs_folders / hs_items (see app/db/schema.ts) — kept here as plain types so
//the mapping stays a pure function that tests can feed without a database.
export type HsFolderRow = {
    id: number,
    parentId: number | null,
    name: string,
    color: string,
    routineId: number | null,
    x: number, y: number, w: number, h: number,
}
export type HsItemRow = {
    id: number,
    tileId: number,
    parentId: number | null,
    syncedFromRoutine: number | null,
    x: number, y: number, w: number, h: number,
}
//the library tile itself (tiles table) — without its events, which the homescreen never
//edits (they're only ever added elsewhere, and removed along with their tile)
export type HsTileRow = {
    id: number,
    name: string,
    mode: number,
    color: string,
    rootRoutineId: number,
}

//everything the homescreen persists, as rows — what gets diffed between two saves
export type HomescreenSnapshot = {
    folders: HsFolderRow[],
    items: HsItemRow[],
    tiles: HsTileRow[],
}

//the root level has no row of its own — it's the folder with folderId undefined that the
//rest of the homescreen expects first in the list (same shape db-mock always produced)
export const ROOT_FOLDER_COLOR = "#888888"

/**
 * Flat hs_folders/hs_items rows → the in-memory HS3Folder list: root level first, then
 * every stored folder, each carrying its own items. parentId null means "on the root",
 * which in memory is parentId undefined. Optional links (routineId, syncedFromRoutine) are
 * left off entirely when null, like objects created in memory. Order is by id, so a load
 * always yields the same list for the same rows.
 */
export function rowsToFolders(folderRows: HsFolderRow[], itemRows: HsItemRow[]): HS3Folder[] {
    const itemsByParent = new Map<number | null, HS3Item[]>()
    for (const row of [...itemRows].sort((a, b) => a.id - b.id)) {
        const item: HS3Item = {
            itemId: row.id,
            tileId: row.tileId,
            parentId: row.parentId ?? undefined,
            layout: {x: row.x, y: row.y, width: row.w, height: row.h},
        }
        if (row.syncedFromRoutine !== null) item.syncedFromRoutine = row.syncedFromRoutine
        const siblings = itemsByParent.get(row.parentId) ?? []
        siblings.push(item)
        itemsByParent.set(row.parentId, siblings)
    }

    const root: HS3Folder = {
        folderId: undefined, name: "", color: ROOT_FOLDER_COLOR, parentId: undefined, layout: undefined,
        items: itemsByParent.get(null) ?? [],
    }
    const folders = [...folderRows].sort((a, b) => a.id - b.id).map(row => {
        const folder: HS3Folder = {
            folderId: row.id,
            name: row.name,
            color: row.color,
            parentId: row.parentId ?? undefined,
            layout: {x: row.x, y: row.y, width: row.w, height: row.h},
            items: itemsByParent.get(row.id) ?? [],
        }
        if (row.routineId !== null) folder.routineId = row.routineId
        return folder
    })
    return [root, ...folders]
}

/**
 * The reverse of rowsToFolders: the in-memory state as rows. The root level isn't stored;
 * an item's parent is taken from the folder that actually holds it (not the item's own
 * parentId, which isn't guaranteed to be kept in step everywhere). Key order is fixed, so
 * two rows describing the same thing compare equal as JSON.
 */
export function toSnapshot(folders: HS3Folder[], tiles: Tile[]): HomescreenSnapshot {
    const folderRows: HsFolderRow[] = []
    const itemRows: HsItemRow[] = []
    for (const folder of folders) {
        const parentOfItems = folder.folderId ?? null
        for (const item of folder.items) {
            itemRows.push({
                id: item.itemId,
                tileId: item.tileId,
                parentId: parentOfItems,
                syncedFromRoutine: item.syncedFromRoutine ?? null,
                x: item.layout.x, y: item.layout.y, w: item.layout.width, h: item.layout.height,
            })
        }
        if (folder.folderId === undefined) continue
        folderRows.push({
            id: folder.folderId,
            parentId: folder.parentId ?? null,
            name: folder.name,
            color: folder.color,
            routineId: folder.routineId ?? null,
            x: folder.layout.x, y: folder.layout.y, w: folder.layout.width, h: folder.layout.height,
        })
    }
    const tileRows: HsTileRow[] = tiles.map(t => ({
        id: t.id, name: t.name, mode: t.mode, color: t.color, rootRoutineId: t.rootRoutineId,
    }))
    return {folders: folderRows, items: itemRows, tiles: tileRows}
}
