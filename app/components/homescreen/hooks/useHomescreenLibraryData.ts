import {useEffect, useState} from "react";
import {useSharedValue} from "react-native-reanimated";
import {HS3Folder, Tile} from "@homescreen/types";
import {getFoldersFromDb, getTilesFromDb} from "@components/homescreen/db-mock";

/**
 * Loads the folder tree + tile library once. Lives above both the navigator and
 * App Drawer (they're peers that both need this), not inside either of them.
 */
export function useHomescreenLibraryData() {
    const folders = useSharedValue<HS3Folder[]>([]);
    const tiles = useSharedValue<Tile[]>([]);
    const [dataLoaded, setDataLoaded] = useState(false)

    useEffect(() => {
        Promise.all([getFoldersFromDb(), getTilesFromDb()])
            .catch(err => {
                console.log(err)
                return undefined
            })
            .then(res => {
                if (!!res) {
                    const [loadedFolders, loadedTiles] = res
                    folders.value = loadedFolders
                    tiles.value = loadedTiles
                    setDataLoaded(true)
                }
            })
    }, []);

    return {folders, tiles, dataLoaded}
}
