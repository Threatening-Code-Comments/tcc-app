import React, {useEffect, useState} from "react";
import {Text} from "react-native-paper";
import {useSharedValue} from "react-native-reanimated";
import {View} from "react-native";
import {HS3Folder} from "./types";
import {getFoldersFromDb} from "@components/homescreen/db-mock";
import {useHomescreenNavigation} from "@homescreen/hooks/useHomescreenNavigation";
import {FolderModal} from "@homescreen/ui/components/folder-modal";
import {Homescreen} from "@components/homescreen/homescreen";

type Props = {}

/**
 * Owns the data that survives across folder navigation (the whole folder tree) and
 * which folder is currently active. The root level renders full-screen; any folder
 * you navigate into opens as a popup (FolderModal) instead of replacing the screen —
 * everything level-scoped (drag state, edit mode, popups, create-flow) lives inside
 * that popup's own Homescreen instance and resets on navigation via remount.
 */
export const HomescreenNavigator = (props: Props) => {
    const folders = useSharedValue<HS3Folder[]>([]);
    const [foldersLoaded, setFoldersLoaded] = useState(false)
    useEffect(() => {
        getFoldersFromDb()
            .catch(err => console.log(err))
            .then(
                res => {
                    if (!!res) {
                        folders.value = res
                        setFoldersLoaded(true)
                    }
                }
            )
    }, []);

    const {currentLevel, folderPath, goToLevel, goUp} = useHomescreenNavigation(folders)

    if (!foldersLoaded) {
        return (
            <View>
                <Text variant={"headlineMedium"}>Loading...</Text>
            </View>
        )
    }

    return <>
        <Homescreen folderId={undefined} folders={folders} onEnterFolder={goToLevel}/>

        <FolderModal currentLevel={currentLevel} folderPath={folderPath} folders={folders}
                     goUp={goUp} goToLevel={goToLevel}/>
    </>
}
