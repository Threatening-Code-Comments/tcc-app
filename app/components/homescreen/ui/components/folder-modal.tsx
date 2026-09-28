import React from "react";
import {Modal, Pressable, StyleSheet, View} from "react-native";
import {useTheme} from "react-native-paper";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {HS3Folder} from "@components/homescreen/types";
import {Breadcrumb} from "@homescreen/ui/components/breadcrumb";
import {Homescreen} from "@components/homescreen/homescreen";
import {GRID_COLUMNS, GRID_UNIT} from "@homescreen/move_algo";

//breathing room between the grid and the popup's rounded edges
const GRID_PADDING = 8;

type Props = {
    currentLevel: number | undefined,
    folderPath: HS3Folder[],
    goUp: () => void,
    goToLevel: (folderId: number | undefined) => void,
}

/**
 * A folder's contents shown as a popup instead of full-screen navigation. Breadcrumb
 * and Homescreen sit in normal flex flow (column) here rather than both being
 * absolutely positioned against the same root the way root-level chrome used to be —
 * that's what used to make the grid's own tiles overlap the breadcrumb bar. The grid
 * now gets its own positioning context starting right below the breadcrumb's height,
 * whatever that height ends up being.
 */
export const FolderModal = ({currentLevel, folderPath, goUp, goToLevel}: Props) => {
    const {colors} = useTheme();

    return (
        <Modal
            visible={currentLevel !== undefined}
            animationType="slide"
            transparent
            onRequestClose={goUp}
        >
            <GestureHandlerRootView style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.35)'}}>
                {/*clickaway: a tap on the dimmed area around the popup closes the folder
                    entirely (back to root) — back button/gesture still only goes up one level.
                    Rendered before the panel, so the panel sits on top and keeps its own touches.*/}
                <Pressable style={StyleSheet.absoluteFill} onPress={() => goToLevel(undefined)}/>
                <View style={{
                    flex: 1,
                    //tiles are laid out in GRID_UNIT (derived from the full screen width), so
                    //the popup has to be exactly as wide as the grid — a fixed margin would
                    //cut off the rightmost column
                    width: GRID_COLUMNS * GRID_UNIT + 2 * GRID_PADDING,
                    alignSelf: 'center',
                    marginVertical: 150,
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: colors.background,
                }}>
                    <Breadcrumb currentLevel={currentLevel} folderPath={folderPath} goUp={goUp}
                                goToLevel={goToLevel}/>
                    <View style={{flex: 1, marginHorizontal: GRID_PADDING}}>
                        {currentLevel !== undefined && (
                            <Homescreen key={currentLevel} folderId={currentLevel}
                                        onEnterFolder={goToLevel}/>
                        )}
                    </View>
                </View>
            </GestureHandlerRootView>
        </Modal>
    )
}
