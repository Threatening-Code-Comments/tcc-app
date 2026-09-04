import React, {useEffect, useState} from "react";
import {Text} from "react-native-paper";
import {useSharedValue} from "react-native-reanimated";
import {View} from "react-native";
import {HS3Folder} from "./types";
import {getFoldersFromDb} from "@components/homescreen/db-mock";
import {useHomescreenNavigation} from "@homescreen/hooks/useHomescreenNavigation";
import {IconButton} from "@components/IconButton";
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
        {currentLevel !== undefined && (
            <View style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                zIndex: 100,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 10,
                paddingTop: 10,
            }} pointerEvents="box-none">
                <IconButton
                    iconName="back"
                    onPress={goUp}
                />
                <View style={{flexDirection: "row", alignItems: "center", flexWrap: "wrap", flexShrink: 1}}>
                    <Text
                        style={{color: "black", fontWeight: "700"}}
                        onPress={() => goToLevel(undefined)}
                    >
                        Home
                    </Text>
                    {folderPath.map((f, index) => (
                        <View key={f.folderId} style={{flexDirection: "row", alignItems: "center"}}>
                            <Text style={{color: "black"}}> / </Text>
                            <Text
                                style={{
                                    color: "black",
                                    fontWeight: index === folderPath.length - 1 ? "700" : "400"
                                }}
                                onPress={() => goToLevel(f.folderId)}
                            >
                                {f.name}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        )}

        <Homescreen key={currentLevel} folderId={currentLevel} folders={folders} onEnterFolder={goToLevel}/>
    </>
}
