import React from "react";
import {Text} from "react-native-paper";
import {View} from "react-native";
import {IconButton} from "@components/IconButton";
import {HS3Folder} from "@components/homescreen/types";

type Props = {
    currentLevel: number | undefined,
    folderPath: HS3Folder[],
    goUp: () => void,
    goToLevel: (folderId: number | undefined) => void,
}

/**
 * "< Home / A / B" chrome shown while inside a folder. Renders nothing at the root level.
 * Normal (non-absolute) layout on purpose — it's meant to sit as a real header above the
 * grid in a flex column, reserving its own space, not float over whatever's underneath.
 */
export const Breadcrumb = ({currentLevel, folderPath, goUp, goToLevel}: Props) => {
    if (currentLevel === undefined) return null

    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 10,
            paddingVertical: 10,
        }}>
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
    )
}
