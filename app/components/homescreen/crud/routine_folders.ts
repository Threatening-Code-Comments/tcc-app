import {HS3Folder, HS3Item, HS3LayoutParams, Routine, Tile} from "@homescreen/types";
import {calculateNextPositionInFolder} from "@homescreen/crud/move_elements";
import {getNextId} from "@homescreen/util";

/**
 * Brings one routine-linked folder in line with its routine: takes over the routine's
 * name/color, adds an item (next free cell) for every routine tile not in the folder yet,
 * and drops items the sync itself added whose tile has since left the routine. Items the
 * user placed by hand, and the layout of everything already there, stay as they are.
 * If the routine no longer exists, the folder just becomes a normal folder with what it has.
 * `allFolders` is only used for id allocation and sub-folder occupancy.
 */
export function syncRoutineFolder(folder: HS3Folder, allFolders: HS3Folder[], tiles: Tile[], routines: Routine[]): HS3Folder {
    const routine = routines.find(r => r.id === folder.routineId)
    if (!routine) {
        const {routineId, ...unlinked} = folder
        return unlinked
    }

    const routineTileIds = new Set(tiles.filter(t => t.rootRoutineId === routine.id).map(t => t.id))
    const kept = folder.items.filter(i => i.syncedFromRoutine !== routine.id || routineTileIds.has(i.tileId))
    const present = new Set(kept.map(i => i.tileId))

    const occupied: HS3LayoutParams[] = [
        ...kept.map(i => i.layout),
        ...allFolders.filter(f => f.folderId !== undefined && f.parentId === folder.folderId).map(f => f.layout),
    ]
    let nextItemId = getNextId("item", allFolders)
    const added: HS3Item[] = tiles
        .filter(t => routineTileIds.has(t.id) && !present.has(t.id))
        .map(tile => {
            const layout = {...calculateNextPositionInFolder(occupied, 1, 1), width: 1, height: 1}
            occupied.push(layout)
            return {itemId: nextItemId++, tileId: tile.id, parentId: folder.folderId, layout, syncedFromRoutine: routine.id}
        })

    return {...folder, name: routine.name, color: routine.color, items: [...kept, ...added]}
}

/**
 * syncRoutineFolder over every linked folder. Returns undefined when nothing changed, so
 * callers reacting to `folders` changes can skip the write (and not loop on their own).
 */
export function syncRoutineFolders(folders: HS3Folder[], tiles: Tile[], routines: Routine[]): HS3Folder[] | undefined {
    let result = folders
    let changed = false

    for (const folder of folders) {
        if (folder.routineId === undefined) continue
        const synced = syncRoutineFolder(folder, result, tiles, routines)
        if (JSON.stringify(synced) !== JSON.stringify(folder)) {
            changed = true
            result = result.map(f => f.folderId === folder.folderId ? synced : f)
        }
    }
    return changed ? result : undefined
}

//whether an item is currently owned by its folder's routine link — removing it by hand
//would be undone by the next sync, so it has to leave the routine instead.
export function isManagedByRoutine(item: HS3Item, folders: HS3Folder[]): boolean {
    if (item.syncedFromRoutine === undefined) return false
    return folders.find(f => f.folderId === item.parentId)?.routineId === item.syncedFromRoutine
}
