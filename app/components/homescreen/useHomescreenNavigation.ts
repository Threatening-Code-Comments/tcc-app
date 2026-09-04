import {useEffect, useState} from "react";
import {SharedValue} from "react-native-reanimated";
import {BackHandler, ToastAndroid} from "react-native";
import {HS3Folder} from "@components/homescreen/types";
import {getFolderPath, getParentLevel} from "@components/homescreen/util";

/**
 * Which folder is the active one, and how to move between levels: breadcrumb path,
 * tapping into a folder, going up one level (back button, hardware or on-screen).
 *
 * `currentLevel` is plain React state, not a SharedValue — it's what drives
 * `<Homescreen key={currentLevel}/>`'s remount, so it has to go through React's
 * render cycle rather than bypass it the way SharedValues do.
 */
export function useHomescreenNavigation(folders: SharedValue<HS3Folder[]>) {
    const [currentLevel, setCurrentLevel] = useState<number | undefined>(undefined)

    const folderPath = getFolderPath(folders.value, currentLevel)

    const goToLevel = (folderId: number | undefined) => setCurrentLevel(folderId)

    const goUp = () => {
        if (currentLevel === undefined) {
            ToastAndroid.show("Already at root level", ToastAndroid.SHORT)
            return
        }
        setCurrentLevel(getParentLevel(folders.value, currentLevel))
    }

    useEffect(() => {
        const backAction = () => {
            goUp()
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, [currentLevel]);

    return {
        currentLevel, folderPath,
        goToLevel, goUp,
    }
}
