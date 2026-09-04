import {useEffect} from "react";
import {SharedValue, useDerivedValue, useSharedValue} from "react-native-reanimated";
import {BackHandler} from "react-native";
import {HS3Element, HS3Folder} from "@components/homescreen/types";
import {getFolderPath, getFoldersForLevel, goUpLevel} from "@components/homescreen/util";

/**
 * Which folder is currently open, and how to move between levels: breadcrumb path,
 * the elements visible at the current level, tapping into a folder, and the
 * hardware/on-screen back button. Doesn't know about drag/drop, edit mode, or popups.
 */
export function useHomescreenNavigation(folders: SharedValue<HS3Folder[]>) {
    const currentLevel = useSharedValue<number | undefined>(undefined)

    const currentFolderLevel = useDerivedValue(() => {
        return getFoldersForLevel(folders.value, currentLevel.value)
    }, [folders, currentLevel])

    const folderPath = useDerivedValue(() => {
        return getFolderPath(folders.value, currentLevel.value)
    }, [folders, currentLevel])

    const visibleElements = useDerivedValue<HS3Element[]>(() => {
        if (!currentFolderLevel.value.main) return []
        return [
            ...currentFolderLevel.value.main.items,
            ...currentFolderLevel.value.more
        ]
    }, [currentFolderLevel])

    const onFolderTap = (folder: HS3Folder) => {
        currentLevel.value = folder.folderId
    }

    useEffect(() => {
        const backAction = () => {
            goUpLevel(currentLevel, folders)
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, []);

    return {
        currentLevel, currentFolderLevel, folderPath, visibleElements,
        onFolderTap,
    }
}
