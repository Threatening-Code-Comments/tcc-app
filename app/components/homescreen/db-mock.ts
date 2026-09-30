import {HS3Folder, Routine, Tile, TileEventStats} from "@components/homescreen/types";
import realData from "../../../local-data/homescreen-mock-data.json";

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export async function getFoldersFromDb() {
    await wait(200)
    return foldersFromDb
}

export async function getTilesFromDb() {
    await wait(200)
    return tilesFromDb
}

export async function getRoutinesFromDb() {
    await wait(200)
    return routinesFromDb
}

export async function getTileEventStatsFromDb(): Promise<TileEventStats> {
    await wait(200)
    const stats: TileEventStats = new Map()
    for (const t of realData.tiles) {
        if (t.events.length === 0) continue
        const lastAt = new Date(t.events.reduce((max, e) => Math.max(max, new Date(e.timestamp).getTime()), 0))
        stats.set(t.id, {count: t.events.length, lastAt})
    }
    return stats
}

//real Routines/Tiles/events from an exported prod backup (see local-data/README or the
//session that generated homescreen-mock-data.json), used purely as realistic dev-build
//data — not real persistence, still in-memory only and reset on reload. The file lives
//under local-data/ (gitignored) precisely because it's real personal data; nothing here
//gets committed. If that file is ever missing, regenerate it from a fresh .db export
//(see the extraction one-liner in this file's git history) before running the app.
const routinesFromDb: Routine[] = realData.routines

const tilesFromDb: Tile[] = realData.tiles.map(t => ({
    id: t.id,
    name: t.name,
    mode: t.mode,
    color: t.color,
    rootRoutineId: t.rootRoutineId,
    //events stay out of the tiles list, see TileEventStats — getTileEventStatsFromDb sums them up
    events: [],
}))

//homescreen starts with just a handful of real tiles pre-placed (so there's something to
//see immediately) — everything else lives in the App Drawer, the now-standard way to get a
//tile onto the homescreen (drag it out), rather than a fully hand-laid-out example screen.
const [firstTile, secondTile, thirdTile] = tilesFromDb
const rootLevel: HS3Folder = {
    folderId: undefined, name: "", color: "#888888", parentId: undefined, layout: undefined,
    items: [
        {itemId: 1, tileId: firstTile.id, layout: {x: 0, y: 0, width: 1, height: 1}},
        {itemId: 2, tileId: secondTile.id, layout: {x: 1, y: 0, width: 2, height: 1}},
        {itemId: 3, tileId: thirdTile.id, layout: {x: 2, y: 1, width: 1, height: 1}},
    ]
}

const foldersFromDb: HS3Folder[] = [rootLevel]
