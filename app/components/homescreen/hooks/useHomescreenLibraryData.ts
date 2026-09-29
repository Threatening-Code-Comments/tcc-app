import {useEffect, useRef, useState} from "react";
import {runOnJS, useAnimatedReaction, useSharedValue} from "react-native-reanimated";
import {HS3Folder, Routine, Tile} from "@homescreen/types";
import {getFoldersFromDb, getRoutinesFromDb, getTilesFromDb} from "@components/homescreen/data-source";
import {AppDrawerDropHandler, DragPreview} from "@components/homescreen/homescreen-data-context";
import {syncRoutineFolders} from "@homescreen/crud/routine_folders";

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

    useEffect(() => {
        Promise.all([getFoldersFromDb(), getTilesFromDb(), getRoutinesFromDb()])
            .catch(err => {
                console.log(err)
                return undefined
            })
            .then(res => {
                if (!!res) {
                    const [loadedFolders, loadedTiles, loadedRoutines] = res
                    folders.value = loadedFolders
                    tiles.value = loadedTiles
                    routines.value = loadedRoutines
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

    return {folders, tiles, routines, dragPreview, homescreenAreaBounds, appDrawerDrop, dataLoaded}
}
