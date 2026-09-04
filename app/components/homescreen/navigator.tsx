import React, {useEffect, useState} from "react";
import {Text} from "react-native-paper";
import {useSharedValue} from "react-native-reanimated";
import {View} from "react-native";
import {HS3Folder, Tile} from "./types";
import {getFoldersFromDb, getTilesFromDb} from "@components/homescreen/db-mock";
import {useHomescreenNavigation} from "@homescreen/hooks/useHomescreenNavigation";
import {FolderModal} from "@homescreen/ui/components/folder-modal";
import {Homescreen} from "@components/homescreen/homescreen";
import {HomescreenDataProvider} from "@components/homescreen/homescreen-data-context";

type Props = {}

/**
 * Owns the data that survives across folder navigation (the whole folder tree, the tile
 * library) and which folder is currently active. The root level renders full-screen; any
 * folder you navigate into opens as a popup (FolderModal) instead of replacing the screen —
 * everything level-scoped (drag state, edit mode, popups, create-flow) lives inside
 * that popup's own Homescreen instance and resets on navigation via remount.
 */
export const HomescreenNavigator = (props: Props) => {
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

    const {currentLevel, folderPath, goToLevel, goUp} = useHomescreenNavigation(folders)

    if (!dataLoaded) {
        return (
            <View>
                <Text variant={"headlineMedium"}>Loading...</Text>
            </View>
        )
    }

    return <HomescreenDataProvider value={{folders, tiles}}>
        <Homescreen folderId={undefined} onEnterFolder={goToLevel}/>

        <FolderModal currentLevel={currentLevel} folderPath={folderPath}
                     goUp={goUp} goToLevel={goToLevel}/>
    </HomescreenDataProvider>
}
