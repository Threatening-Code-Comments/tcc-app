import React, {useEffect, useState} from "react";
import {Text} from "react-native-paper";
import {useSharedValue} from "react-native-reanimated";
import {View} from "react-native";
import {HS3Folder} from "./types";
import {getFoldersFromDb} from "@components/homescreen/db-mock";
import {useHomescreenNavigation} from "@homescreen/hooks/useHomescreenNavigation";
import {Breadcrumb} from "@homescreen/ui/components/breadcrumb";
import {Homescreen} from "@components/homescreen/homescreen";

type Props = {}

/**
 * Owns the data that survives across folder navigation (the whole folder tree) and
 * which folder is currently active. Renders the breadcrumb chrome, and mounts a fresh
 * `Homescreen` per active folder (remounted via `key` on navigation) — everything
 * level-scoped (drag state, edit mode, popups, create-flow) lives inside that instance.
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
                <Text variant={"headlineMedium"} style={{color: 'black'}}>Loading...</Text>
            </View>
        )
    }

    return <>
        <Breadcrumb currentLevel={currentLevel} folderPath={folderPath} goUp={goUp} goToLevel={goToLevel}/>

        <Homescreen key={currentLevel} folderId={currentLevel} folders={folders} onEnterFolder={goToLevel}/>
    </>
}
