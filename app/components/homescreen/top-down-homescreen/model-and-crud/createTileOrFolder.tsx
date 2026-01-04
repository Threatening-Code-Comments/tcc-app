import {HS3Element, HS3Folder, HS3Item, HS3LayoutParams} from '../../types'
import {moveElementsToFolder} from "@components/homescreen/top-down-homescreen/model-and-crud/move_elements";

export const addToNewFolder = (
    draggedElement: HS3Element,
    stationaryElement: HS3Element,
    folders: HS3Folder[],
    currentLevel: number
) => {
    return createFolder(
        [draggedElement, stationaryElement],
        folders, currentLevel, {x: 2, y: 2, width: 1, height: 1}
    );
}

/**
 * Creates a folder in the folders, and returns the new ones
 * @param children items to add to the new folder
 * @param folders original folders coming in
 * @param currentLevel future parent
 * @param location place to put the new folder
 * @returns Updated folders
 */
export function createFolder(children: HS3Element[], folders: HS3Folder[], currentLevel: number, location: HS3LayoutParams | undefined): HS3Folder[] {
    let newFolders = folders.map(f => f)

    const highestId: number = folders
        .reduce(
            (prev, curr) =>
                (prev > curr.folderId)
                    ? prev : curr.folderId,
            -1
        )

    const newFolder: HS3Folder = {
        folderId: highestId + 1,
        layout: location,
        parentId: currentLevel,
        name: 'New Folder',
        //all items are already added here
        items: children.filter(e => "itemId" in e) as HS3Item[]
    }
    newFolders.push(newFolder)
    newFolders = moveElementsToFolder(children, newFolders, newFolder);


    return newFolders
}