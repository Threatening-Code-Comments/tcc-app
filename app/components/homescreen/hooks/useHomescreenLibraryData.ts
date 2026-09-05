import {useEffect, useState} from "react";
import {useSharedValue} from "react-native-reanimated";
import {HS3Folder, Routine, Tile} from "@homescreen/types";
import {getFoldersFromDb, getRoutinesFromDb, getTilesFromDb} from "@components/homescreen/db-mock";
import {DragPreview} from "@components/homescreen/homescreen-data-context";

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

    return {folders, tiles, routines, dragPreview, homescreenAreaBounds, dataLoaded}
}
