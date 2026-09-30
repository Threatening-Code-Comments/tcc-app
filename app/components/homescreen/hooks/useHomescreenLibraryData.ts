import {useEffect, useRef, useState} from "react";
import {runOnJS, useAnimatedReaction, useSharedValue} from "react-native-reanimated";
import {HS3Folder, Routine, Tile, TileEventStats} from "@homescreen/types";
import {getFoldersFromDb, getRoutinesFromDb, getTileEventStatsFromDb, getTilesFromDb, HOMESCREEN_DATA_SOURCE} from "@components/homescreen/data-source";
import {AppDrawerDropHandler, DragPreview} from "@components/homescreen/homescreen-data-context";
import {syncRoutineFolders} from "@homescreen/crud/routine_folders";
import {HomescreenSnapshot, toSnapshot} from "@homescreen/persistence/rows";
import {usePersistHomescreen} from "@homescreen/hooks/usePersistHomescreen";

/**
 * Loads the folder tree + tile library once, and owns the App-Drawer-drag bridge state.
 * Lives above both the navigator and App Drawer (they're peers that both need this), not
 * inside either of them.
 */
export function useHomescreenLibraryData() {
    const folders = useSharedValue<HS3Folder[]>([]);
    const tiles = useSharedValue<Tile[]>([]);
    const routines = useSharedValue<Routine[]>([]);
    const dragPreview = useSharedValue<DragPreview | undefined>(undefined);
    const homescreenAreaBounds = useSharedValue<{ x: number, y: number, width: number, height: number } | undefined>(undefined);
    const appDrawerDrop = useRef<AppDrawerDropHandler | undefined>(undefined);
    const [dataLoaded, setDataLoaded] = useState(false)
    //what the database held at load time — the persistence baseline (only with the real db)
    const [loadedSnapshot, setLoadedSnapshot] = useState<HomescreenSnapshot | undefined>(undefined)
    //plain React state, deliberately not a SharedValue — see TileEventStats
    const [tileEventStats, setTileEventStats] = useState<TileEventStats>(new Map())

    useEffect(() => {
        Promise.all([getFoldersFromDb(), getTilesFromDb(), getRoutinesFromDb(), getTileEventStatsFromDb()])
            .catch(err => {
                console.log(err)
                return undefined
            })
            .then(res => {
                if (!!res) {
                    const [loadedFolders, loadedTiles, loadedRoutines, loadedStats] = res
                    folders.value = loadedFolders
                    tiles.value = loadedTiles
                    routines.value = loadedRoutines
                    setTileEventStats(loadedStats)
                    if (HOMESCREEN_DATA_SOURCE === "db") setLoadedSnapshot(toSnapshot(loadedFolders, loadedTiles))
                    setDataLoaded(true)
                }
            })
    }, []);

    //keeps routine-linked folders live: whenever tiles, routines or the folder tree change,
    //linked folders are re-synced. Lives here (not in a Homescreen level) so it also runs
    //for changes made from the App Drawer. The sync returns undefined once everything is in
    //line, so its own write doesn't loop.
    const syncLinkedFolders = () => {
        const synced = syncRoutineFolders(folders.value, tiles.value, routines.value)
        if (synced) folders.value = synced
    }
    useAnimatedReaction(
        () => ({folders: folders.value, tiles: tiles.value, routines: routines.value}),
        (current, previous) => {
            if (current !== previous) runOnJS(syncLinkedFolders)()
        }, [folders, tiles, routines]
    )

    usePersistHomescreen(folders, tiles, loadedSnapshot)

    return {folders, tiles, routines, tileEventStats, dragPreview, homescreenAreaBounds, appDrawerDrop, dataLoaded}
}
