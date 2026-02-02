import {HS3Folder} from "@components/homescreen/types";

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export async function getFoldersFromDb() {
    await wait(200)
    return itemsFromDb
}

//treated as an undefined folder
const rootLevel: HS3Folder = {
    folderId: undefined, name: "", parentId: undefined, layout: undefined, items: [
        {
            itemId: 1, layout: {x: 0, y: 0, width: 1, height: 1},
            name: "Döner"
        },
        {
            itemId: 2, layout: {x: 1, y: 0, width: 2, height: 1},
            name: "Döner oder Pizza gegessen"
        },
        {
            itemId: 3, layout: {x: 2, y: 1, width: 1, height: 1},
            name: "Einkaufen"
        }
    ]
}

//folder at x0y2 root level
const folder1: HS3Folder = {
    folderId: 1, name: "Essen", parentId: undefined, layout: {x: 0, y: 2, width: 1, height: 1}, items: [
        {
            itemId: 4, parentId: 1, layout: {x: 0, y: 0, width: 1, height: 1}, name: "Pitzer"
        }, {
            itemId: 5, parentId: 1, layout: {x: 1, y: 1, width: 1, height: 1}, name: "Käsekuchen"
        }
    ]
}
//folder2 is inside folder1 (x1y0)
const folder2: HS3Folder = {
    folderId: 2, name: "Döner", parentId: 1, layout: {x: 1, y: 0, width: 1, height: 1}, items: [
        {itemId: 6, parentId: 2, layout: {x: 1, y: 0, width: 1, height: 1}, name: "Dürüm"}
    ]
}

const itemsFromDb: HS3Folder[] = [
    rootLevel, folder1, folder2
]