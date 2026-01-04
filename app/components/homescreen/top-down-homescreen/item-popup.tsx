import React from "react";
import {HS3Element, HS3Folder, HS3Item} from '../types'
import {Text} from 'react-native-paper'
import {getElementKey} from "@components/homescreen/top-down-homescreen/top-down-util";
import {usePopup} from "@components/hooks/usePopup";

type Props = {
    item: HS3Item | undefined,
    folders: HS3Folder[]
}

function getItemPath(e: HS3Element, folders: HS3Folder[]) {
    const parentId = e.parentId

    if (parentId === undefined) {
        return "/"
    } else {
        const parent = folders.find(f => f.folderId === parentId)
        return getItemPath(parent, folders) + getElementKey(parent) + "/"
    }
}

export const useItemPopup = (props: Props) => {
    const {item, folders} = props

    const popupContent = !!item && (<>
        <Text variant={"displaySmall"}>Item: {item.itemId}</Text>
        <Text>Currently at {getItemPath(item, folders)}</Text>
    </>)

    const popup = usePopup({children: popupContent})

    return {
        visible: popup.visible,
        setVisible: popup.setVisible,
        component: popup.component,
    }
}
