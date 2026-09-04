import React from "react";
import {Modal, View} from "react-native";
import {SharedValue} from "react-native-reanimated";
import {HS3Folder} from "@components/homescreen/types";
import {Breadcrumb} from "@homescreen/ui/components/breadcrumb";
import {Homescreen} from "@components/homescreen/homescreen";

type Props = {
    currentLevel: number | undefined,
    folderPath: HS3Folder[],
    folders: SharedValue<HS3Folder[]>,
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
export const FolderModal = ({currentLevel, folderPath, folders, goUp, goToLevel}: Props) => {
    return (
        <Modal
            visible={currentLevel !== undefined}
            animationType="slide"
            onRequestClose={goUp}
        >
            <View style={{flex: 1, backgroundColor: '#f2f2f2'}}>
                <Breadcrumb currentLevel={currentLevel} folderPath={folderPath} goUp={goUp} goToLevel={goToLevel}/>
                <View style={{flex: 1}}>
                    {currentLevel !== undefined && (
                        <Homescreen key={currentLevel} folderId={currentLevel} folders={folders}
                                    onEnterFolder={goToLevel}/>
                    )}
                </View>
            </View>
        </Modal>
    )
}
