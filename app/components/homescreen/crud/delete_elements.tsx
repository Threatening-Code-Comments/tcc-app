import {HS3Element, HS3Folder} from "@homescreen/types";

/**
 * Removes a placement from the homescreen. An item just disappears from its folder; a
 * folder takes everything inside it along (its items and, recursively, its sub-folders).
 * Library tiles themselves are never touched — deleting here only removes the placement,
 * the tile stays in the App Drawer.
 */
export function deleteElement(element: HS3Element, folders: HS3Folder[]): HS3Folder[] {
    if ("itemId" in element) {
        return folders.map(f =>
            f.folderId === element.parentId
                ? {...f, items: f.items.filter(i => i.itemId !== element.itemId)}
                : f
        )
    }

    const toRemove = new Set<number>()
    const collect = (folderId: number) => {
        toRemove.add(folderId)
        folders
            .filter(f => f.folderId !== undefined && f.parentId === folderId)
            .forEach(f => collect(f.folderId))
    }
    collect(element.folderId)

    return folders.filter(f => f.folderId === undefined || !toRemove.has(f.folderId))
}
