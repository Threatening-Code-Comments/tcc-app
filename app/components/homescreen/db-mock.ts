import {HS3Folder, Tile} from "@components/homescreen/types";
import {getRandomColor} from "@homescreen/util";

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export async function getFoldersFromDb() {
    await wait(200)
    return foldersFromDb
}

export async function getTilesFromDb() {
    await wait(200)
    return tilesFromDb
}

//rootRoutineId is repurposed as "which App Drawer folder this tile is filed under" —
//kept as the same field name as the real DbTypes.Tile on purpose (not renamed), since
//the real column stays as-is when this eventually wires up to the actual DB. 0 means
//uncategorized for now — App Drawer folder browsing isn't built yet.
const UNCATEGORIZED = 0

const tilesFromDb: Tile[] = [
    {id: 1, name: "Döner", mode: 0, rootRoutineId: UNCATEGORIZED, color: getRandomColor(), events: []},
    {id: 2, name: "Döner oder Pizza gegessen", mode: 0, rootRoutineId: UNCATEGORIZED, color: getRandomColor(), events: []},
    {id: 3, name: "Einkaufen", mode: 0, rootRoutineId: UNCATEGORIZED, color: getRandomColor(), events: []},
    {id: 4, name: "Pitzer", mode: 0, rootRoutineId: UNCATEGORIZED, color: getRandomColor(), events: []},
    {id: 5, name: "Käsekuchen", mode: 0, rootRoutineId: UNCATEGORIZED, color: getRandomColor(), events: []},
    {id: 6, name: "Dürüm", mode: 0, rootRoutineId: UNCATEGORIZED, color: getRandomColor(), events: []},
]

//treated as an undefined folder
const rootLevel: HS3Folder = {
    folderId: undefined, name: "", color: getRandomColor(), parentId: undefined, layout: undefined, items: [
        {itemId: 1, tileId: 1, layout: {x: 0, y: 0, width: 1, height: 1}},
        {itemId: 2, tileId: 2, layout: {x: 1, y: 0, width: 2, height: 1}},
        {itemId: 3, tileId: 3, layout: {x: 2, y: 1, width: 1, height: 1}},
    ]
}

//folder at x0y2 root level
const folder1: HS3Folder = {
    folderId: 1, name: "Essen", color: getRandomColor(), parentId: undefined, layout: {x: 0, y: 2, width: 1, height: 1}, items: [
        {itemId: 4, tileId: 4, parentId: 1, layout: {x: 0, y: 0, width: 1, height: 1}},
        {itemId: 5, tileId: 5, parentId: 1, layout: {x: 1, y: 1, width: 1, height: 1}},
    ]
}
//folder2 is inside folder1 (x1y0)
const folder2: HS3Folder = {
    folderId: 2, name: "Döner", color: getRandomColor(), parentId: 1, layout: {x: 1, y: 0, width: 1, height: 1}, items: [
        {itemId: 6, tileId: 6, parentId: 2, layout: {x: 1, y: 0, width: 1, height: 1}},
    ]
}

const foldersFromDb: HS3Folder[] = [
    rootLevel, folder1, folder2
]
