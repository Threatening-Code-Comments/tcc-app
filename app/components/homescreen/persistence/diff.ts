import {HomescreenSnapshot, HsFolderRow} from "@homescreen/persistence/rows";

export type RowDiff<T> = {
    //new or changed rows, written as insert-or-update
    upserts: T[],
    //ids of rows that are gone
    deletes: number[],
}

export type HomescreenDiff = {
    folders: RowDiff<HsFolderRow>,
    items: RowDiff<HomescreenSnapshot["items"][number]>,
    tiles: RowDiff<HomescreenSnapshot["tiles"][number]>,
}

/** Rows present in `next` but not identical in `prev` are upserts; ids only in `prev` are deletes. */
export function diffById<T extends { id: number }>(prev: T[], next: T[]): RowDiff<T> {
    const prevById = new Map(prev.map(r => [r.id, JSON.stringify(r)]))
    const nextIds = new Set(next.map(r => r.id))
    return {
        upserts: next.filter(r => prevById.get(r.id) !== JSON.stringify(r)),
        deletes: prev.filter(r => !nextIds.has(r.id)).map(r => r.id),
    }
}

/**
 * What to write to get the database from `prev` to `next`, already in an order that's safe
 * with foreign keys on: folder upserts parents first, folder deletes children first (each
 * judged by the snapshot the folders are in).
 */
export function diffSnapshots(prev: HomescreenSnapshot, next: HomescreenSnapshot): HomescreenDiff {
    const folders = diffById(prev.folders, next.folders)
    const nextDepth = folderDepths(next.folders)
    const prevDepth = folderDepths(prev.folders)
    return {
        folders: {
            upserts: [...folders.upserts].sort((a, b) => nextDepth.get(a.id) - nextDepth.get(b.id)),
            deletes: [...folders.deletes].sort((a, b) => prevDepth.get(b) - prevDepth.get(a)),
        },
        items: diffById(prev.items, next.items),
        tiles: diffById(prev.tiles, next.tiles),
    }
}

export function isEmptyDiff(diff: HomescreenDiff): boolean {
    return [diff.folders, diff.items, diff.tiles].every(d => d.upserts.length === 0 && d.deletes.length === 0)
}

//distance of each folder from the root (root-level folders = 0). A parent that isn't in the
//list, or a cycle, just ends the walk — this only orders writes, it doesn't validate.
function folderDepths(folders: HsFolderRow[]): Map<number, number> {
    const parentOf = new Map(folders.map(f => [f.id, f.parentId]))
    const depths = new Map<number, number>()
    for (const folder of folders) {
        let depth = 0
        const seen = new Set([folder.id])
        let parent = folder.parentId
        while (parent !== null && parentOf.has(parent) && !seen.has(parent)) {
            seen.add(parent)
            depth++
            parent = parentOf.get(parent)
        }
        depths.set(folder.id, depth)
    }
    return depths
}
