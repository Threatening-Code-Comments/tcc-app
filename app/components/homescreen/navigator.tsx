import React from "react";
import {useHomescreenNavigation} from "@homescreen/hooks/useHomescreenNavigation";
import {FolderModal} from "@homescreen/ui/components/folder-modal";
import {Homescreen} from "@components/homescreen/homescreen";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

type Props = {}

/**
 * Which folder is currently active, on top of the shared data (folders/tiles) that
 * HomescreenTempWrapper already loaded and provided. The root level renders full-screen;
 * any folder you navigate into opens as a popup (FolderModal) instead of replacing the
 * screen — everything level-scoped (drag state, edit mode, popups, create-flow) lives
 * inside that popup's own Homescreen instance and resets on navigation via remount.
 */
export const HomescreenNavigator = (props: Props) => {
    const {folders} = useHomescreenData()
    const {currentLevel, folderPath, goToLevel, goUp} = useHomescreenNavigation(folders)

    return <>
        <Homescreen folderId={undefined} onEnterFolder={goToLevel}/>

        <FolderModal currentLevel={currentLevel} folderPath={folderPath}
                     goUp={goUp} goToLevel={goToLevel}/>
    </>
}
