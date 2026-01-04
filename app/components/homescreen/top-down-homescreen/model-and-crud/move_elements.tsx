import {HS3Element, HS3Folder, HS3Item} from "../../types";

export function moveElementsToFolder(elements: HS3Element[], folders: HS3Folder[], newParentFolder: HS3Folder) {
    let folders1 = folders


    for (let element of elements) {
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
            folders1 = folders1.map(f => f.folderId === newParentFolder.folderId
                ? {
                    ...newParentFolder,
                    items: [...newParentFolder.items, element as HS3Item].map(nfItem => nfItem.itemId === (element as HS3Item).itemId
                        ? {...(element as HS3Item), parentId: newParentFolder.folderId}
                        : nfItem)
                }
                : f)
            continue
        } else {
            //so it's a folder so
            element.parentId = newParentFolder.folderId
            folders1 = folders1.map(f => f.folderId === (element as HS3Folder).folderId
                ? {...(element as HS3Folder), parentId: newParentFolder.folderId}
                : f)
        }
    }

    console.log("before updating folders:", JSON.stringify(folders1.map(f => ({
        fId: f.folderId, parent: f.parentId, items: f.items.map(
            i => ({iId: i.itemId, parent: i.parentId})
        )
    }))))
    return folders1;
}