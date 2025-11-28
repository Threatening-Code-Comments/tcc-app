import {HS3Folder} from "@components/homescreen/3-homescreen/3_homescreenHandler";

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export async function getFoldersFromDb(){
    await wait(200)
    return itemsFromDb
}

//treated as an undefined folder
const rootLevel = {
    folderId: undefined, parentId: undefined, layout: undefined, items: [
        {
            itemId: 1, layout: {x: 0, y: 0, width: 1, height: 1}
        },
        {
            itemId: 2, layout: {x: 1, y: 0, width: 2, height: 1}
        },
        {
            itemId: 3, layout: {x: 2, y: 1, width: 1, height: 1}
        }
    ]
}

//folder at x0y2 root level
const folder1: HS3Folder = {
    folderId: 1, parentId: undefined, layout: {x: 0, y: 2, width: 1, height: 1}, items: [
        {
            itemId: 4, parentId: 1, layout: {x: 0, y: 0, width: 1, height: 1}
        }, {
            itemId: 5, parentId: 1, layout: {x: 1, y: 1, width: 1, height: 1}
        }
    ]
}
//folder2 is inside folder1 (x1y0)
const folder2: HS3Folder = {
    folderId: 2, parentId: 1, layout: {x: 1, y: 0, width: 1, height: 1}, items: [
        {itemId: 6, parentId: 2, layout: {x: 1, y: 0, width: 1, height: 1}}
    ]
}

const itemsFromDb: HS3Folder[] = [
    rootLevel, folder1, folder2
]