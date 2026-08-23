import {GridValue, HS3Element, HS3Folder, HS3Item, HS3LayoutParams, PixelPoint} from "../../types";
import {GRID_COLUMNS} from "@homescreen/move_algo";

// Helper function to check for overlap between two rectangular items.
function doItemsOverlap(
    item1: HS3LayoutParams,
    item2: HS3LayoutParams
): boolean {
    // If one rectangle is on left side of other
    if (item1.x >= item2.x + item2.width || item2.x >= item1.x + item1.width) {
        return false;
    }

    // If one rectangle is above other
    if (item1.y >= item2.y + item2.height || item2.y >= item1.y + item1.height) {
        return false;
    }

    return true;
}

/**
 * Calculates the next available position for an item within a folder's grid.
 * It searches for the top-most, left-most available slot.
 * @param itemsInFolder - An array of existing elements in the folder, each with x, y, w, h properties.
 * @param itemToPlaceW - The width of the item to be placed.
 * @param itemToPlaceH - The height of the item to be placed.
 * @returns The {x, y} coordinates for the new item.
 */
export function calculateNextPositionInFolder(
    itemsInFolder: HS3LayoutParams[],
    itemToPlaceW: number,
    itemToPlaceH: number,
): PixelPoint {
    let y = 0;
    // Loop forever downwards, row by row
    while (true) {
        // Iterate through columns in the current row
        for (let x = 0; x <= GRID_COLUMNS - itemToPlaceW; x++) {
            const potentialLayout = {
                x,
                y,
                width: itemToPlaceW,
                height: itemToPlaceH
            };

            let overlapFound = false;
            // Check for overlap with all existing items
            for (const existingItem of itemsInFolder) {
                if (doItemsOverlap(potentialLayout, existingItem)) {
                    overlapFound = true;
                    break; // Found overlap, try next position
                }
            }

            // If no overlap was found, this position is free
            if (!overlapFound) {
                return {x, y};
            }
        }
        y++; // Move to the next row
    }
}

export function moveElementsToFolder(elements: HS3Element[], folders: HS3Folder[], newParentFolder: HS3Folder) {
    let folders1 = folders

    const getChildren = (e: HS3Element, folders: HS3Folder[]): HS3LayoutParams[] => {
        if ("itemId" in e) {
            // return [e.layout]
            return
        } else {
            const items = folders.find(f => f.folderId === newParentFolder.folderId).items.map(i => i.layout)
            const folderChilds = folders.filter(f => f.parentId === e.folderId).map(f => f.layout)
            return [...items, ...folderChilds]
        }
    }


    for (let element of elements) {
        const newPosition = calculateNextPositionInFolder(
            getChildren(newParentFolder, folders1),
            element.layout.width, element.layout.height
        )

        if ("itemId" in element) {
            console.log(element.itemId, "is Item")
            //finagle the item out of its prior parent and change the parent id in it to the now
            folders1 = folders1.map(f =>
                f.folderId === element.parentId
                    ? {
                        ...f, items: f.items.filter(i =>
                            i.itemId !== (element as HS3Item).itemId
                        )
                    }
                    : f
            )
            console.log("new parent id:", newParentFolder.folderId)
            element.parentId = newParentFolder.folderId
            element.layout = {...element.layout, ...newPosition}
            const newItems =
                (newParentFolder.items.some(i => i.itemId === (element as HS3Item).itemId)
                    ? newParentFolder.items
                    : [...newParentFolder.items, element])
                    .map(nfItem => nfItem.itemId === (element as HS3Item).itemId
                        ? {...(element as HS3Item), parentId: newParentFolder.folderId}
                        : nfItem
                    )

            folders1 = folders1.map(f => f.folderId === newParentFolder.folderId
                ? {
                    ...newParentFolder,
                    items: newItems
                }
                : f)
            console.log("after:", JSON.stringify(folders1.map(folder => ({
                id: folder.folderId,
                folderName: folder.name,
                items: folder.items.map(i => ({id: i.itemId, p: i.parentId, name: i.name}))
            }))))
            continue
        } else {
            //so it's a folder so
            element.parentId = newParentFolder.folderId
            element.layout = {...element.layout, ...newPosition}
            folders1 = folders1.map(f => f.folderId === (element as HS3Folder).folderId
                ? {...(element as HS3Folder), parentId: newParentFolder.folderId}
                : f)
        }
    }

    // console.log("before updating folders:", JSON.stringify(folders1.map(f => ({
    //     fId: f.folderId, parent: f.parentId, items: f.items.map(
    //         i => ({iId: i.itemId, parent: i.parentId})
    //     )
    // }))))
    return folders1;
}