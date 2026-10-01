import React, {useEffect, useState} from "react";
import {View} from "react-native";
import {HS3Element, HS3Folder} from '../types'
import {Text} from 'react-native-paper'
import {getElementPath} from "@components/homescreen/util";
import {usePopup} from "@components/hooks/usePopup";
import {IconButton} from "@components/IconButton";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

type Props = {
    element: HS3Element | undefined,
    folders: HS3Folder[],
    onDelete: (element: HS3Element) => void,
    //item belongs to its folder's routine link — can't be removed here, only by taking
    //the tile out of the routine
    managedByRoutine?: boolean,
}

//long-press popup for an item or folder. Delete asks once more before acting, since a
//folder takes its whole contents with it.
export const useElementPopup = (props: Props) => {
    const {element, folders, onDelete, managedByRoutine = false} = props
    const {tileById} = useHomescreenData()
    const [confirming, setConfirming] = useState(false)

    useEffect(() => setConfirming(false), [element])

    const isItem = !!element && "itemId" in element
    const title = !element ? ""
        : ("itemId" in element)
            ? tileById.get(element.tileId)?.name ?? `Item ${element.itemId}`
            : element.name
    const childCount = (!element || "itemId" in element) ? 0
        : element.items.length + folders.filter(f => f.parentId === element.folderId).length

    const popupContent = !!element && (<View style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        <Text variant={"headlineSmall"}>{title}</Text>
        <Text>{isItem ? "Item" : "Folder"} at {getElementPath(element, folders)}</Text>

        {!("itemId" in element) && element.routineId !== undefined && (
            <Text style={{opacity: 0.8}}>Linked to its routine — tiles follow it automatically.</Text>
        )}

        {managedByRoutine
            ? <Text style={{opacity: 0.8}}>Part of this folder's routine. Remove it from the routine to take it out here.</Text>
            : confirming
            ? <>
                <Text>
                    {isItem
                        ? "Remove from the homescreen? The tile stays in the App Drawer."
                        : `Delete this folder${childCount > 0 ? ` and its ${childCount} element(s)` : ""}? Tiles stay in the App Drawer.`}
                </Text>
                <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
                    <IconButton iconName={"close"} text={"Cancel"} type={"transparent"}
                                onPress={() => setConfirming(false)}/>
                    <IconButton iconName={"delete"} text={"Delete"} type={"error"}
                                onPress={() => onDelete(element)}/>
                </View>
            </>
            : <IconButton iconName={"delete"} text={"Delete"} type={"error"}
                          onPress={() => setConfirming(true)}/>}
    </View>)

    const popup = usePopup({children: popupContent})

    return {
        visible: popup.visible,
        setVisible: popup.setVisible,
        component: popup.component,
    }
}
