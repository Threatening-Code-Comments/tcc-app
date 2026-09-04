import React, {useState} from "react";
import {FAB} from "react-native-paper";
import {ToastAndroid, View} from "react-native";
import {SharedValue} from "react-native-reanimated";
import {DragState, HS3Element, HS3Item} from "@homescreen/types";
import {useCreateLayoutOverlay, useCreateTilePopup} from "@homescreen/hooks/useCreateTileOrFolderPopup";
import {getModifiedTempElements} from "@homescreen/util";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

type Props = {
    folderId: number | undefined
    dragState: SharedValue<DragState | undefined>
    tempElements: SharedValue<HS3Element[]>
    tempElementsImpossible: SharedValue<HS3Element[]>
    onMutated: () => void
}

/**
 * The "+" FAB and everything it opens: dragging out a new tile's position, naming it,
 * merging it into `folders` on confirm. Self-contained — Homescreen just needs to give
 * it the shared drag state (it reuses the same "drag out a rectangle" preview machinery
 * as a normal drag) and folderId to place the new element into.
 */
export const CreateElementControls = ({
    folderId, dragState, tempElements, tempElementsImpossible, onMutated,
}: Props) => {
    const {folders} = useHomescreenData()
    const [showCreateFABs, setShowCreateFABs] = useState(false)

    const createPositionOverlay = useCreateLayoutOverlay({
        onStart: (layout, coordinate) => {
            dragState.value = {type: "create", element: layout, coordinate}
        },
        onUpdate: (layout, coordinate) => {
            dragState.value = {type: "create", element: layout, coordinate}
        },
        onCancel: () => {
            dragState.value = undefined
            setShowCreateFABs(false)
        },
        onConfirm: (element) => {
            if (tempElementsImpossible.value.length > 0) {
                ToastAndroid.show("Error......", ToastAndroid.SHORT)
                dragState.value = undefined
                setShowCreateFABs(false)
                return
            }
            let newFolders = folders.value

            if ("itemId" in element) {
                const parent = folders.value.find(f => f.folderId === element.parentId)
                parent.items = [...parent.items, element]

                newFolders = folders.value.map(f =>
                    (f.folderId === element.parentId) ? parent : f
                )
            } else {
                newFolders = [...folders.value, element]
            }

            folders.value = getModifiedTempElements(tempElements.value, newFolders)

            dragState.value = undefined
            setShowCreateFABs(false)
            onMutated()
        }
    })
    const tileCreatePopup = useCreateTilePopup({
        currentLevel: folderId,
        onSubmit: (item: HS3Item) => createPositionOverlay.setElement(item)
    })

    const createFabProps = showCreateFABs
        ? {icon: "window-close", label: "Cancel", variant: "tertiary" as const}
        : {icon: "plus", label: "", variant: "primary" as const}

    return <>
        {createPositionOverlay.component}
        {tileCreatePopup.component}
        <FAB style={{
            position: "absolute",
            right: 20, bottom: 150,
            zIndex: 100,
        }} size={"medium"}
             {...createFabProps}
             onPress={() => setShowCreateFABs(v => !v)}
        />

        {showCreateFABs
            ? <View style={{
                position: 'absolute',
                bottom: 230, right: 25,
                width: "100%",
                display: "flex", flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10, zIndex: 100
            }}>
                <FAB icon={"rectangle"}
                     variant={"secondary"}
                     label={"Tile"}
                     style={{zIndex: 100}}
                     onPress={() => tileCreatePopup.setVisible(true)}
                />

                <FAB icon={"folder"}
                     variant={"secondary"}
                     label={"Folder"}
                     style={{zIndex: 100}}
                />
            </View>
            : null}
    </>
}
