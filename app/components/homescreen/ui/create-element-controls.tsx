import React, {useState} from "react";
import {FAB} from "react-native-paper";
import {ToastAndroid, View} from "react-native";
import {runOnJS, SharedValue, useAnimatedReaction} from "react-native-reanimated";
import {DragState, HS3Element, HS3Folder, HS3Item} from "@homescreen/types";
import {
    useCreateFolderPopup,
    useCreateLayoutOverlay,
    useCreateTilePopup,
    usePlaceExistingTilePopup,
} from "@homescreen/hooks/useCreateTileOrFolderPopup";
import {getModifiedTempElements, isOutOfGridBounds} from "@homescreen/util";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

type Props = {
    folderId: number | undefined
    dragState: SharedValue<DragState | undefined>
    tempElements: SharedValue<HS3Element[]>
    tempElementsImpossible: SharedValue<HS3Element[]>
    onMutated: () => void
}

/**
 * The "+" FAB and everything it opens: a new tile (named, registered in the library), an
 * existing library tile or routine (as a pre-filled folder), or an empty folder — each then dragged out to its position and
 * merged into `folders` on confirm. Self-contained — Homescreen just needs to give
 * it the shared drag state (it reuses the same "drag out a rectangle" preview machinery
 * as a normal drag) and folderId to place the new element into.
 */
//memoized: its props are shared values (stable), folderId and a stable onMutated, so it no
//longer re-renders — and re-runs its popups' hooks — with every re-render of the level
export const CreateElementControls = React.memo((props: Props) => <CreateElementControlsView {...props}/>)

const CreateElementControlsView = ({
    folderId, dragState, tempElements, tempElementsImpossible, onMutated,
}: Props) => {
    const {folders} = useHomescreenData()
    const [showCreateFABs, setShowCreateFABs] = useState(false)

    //the element being placed can't be saved if it (or a neighbour it would push away) ends
    //up off the grid or overlapping — or if it's been dragged up/left to less than one cell
    const [isPlacementImpossible, setIsPlacementImpossible] = useState(false)
    useAnimatedReaction(
        () => {
            const state = dragState.value
            if (state?.type !== "create") return false
            const {layout} = state.element
            return tempElementsImpossible.value.length > 0
                || layout.width < 1 || layout.height < 1
                || isOutOfGridBounds(layout)
        },
        (impossible, prev) => {
            if (impossible !== prev) runOnJS(setIsPlacementImpossible)(impossible)
        }, [dragState, tempElementsImpossible])

    const createPositionOverlay = useCreateLayoutOverlay({
        canConfirm: !isPlacementImpossible,
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
            //Save is disabled while the placement is impossible — this only guards a stale tap
            if (isPlacementImpossible) {
                ToastAndroid.show("Couldn't place", ToastAndroid.SHORT)
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
    const placeExistingPopup = usePlaceExistingTilePopup({
        currentLevel: folderId,
        onSubmit: (element: HS3Element) => createPositionOverlay.setElement(element)
    })
    const folderCreatePopup = useCreateFolderPopup({
        currentLevel: folderId,
        onSubmit: (folder: HS3Folder) => createPositionOverlay.setElement(folder)
    })

    const createFabProps = showCreateFABs
        ? {icon: "window-close", label: "Cancel", variant: "tertiary" as const}
        : {icon: "plus", label: "", variant: "primary" as const}

    return <>
        {createPositionOverlay.component}
        {tileCreatePopup.component}
        {placeExistingPopup.component}
        {folderCreatePopup.component}
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

                <FAB icon={"magnify"}
                     variant={"secondary"}
                     label={"Existing"}
                     style={{zIndex: 100}}
                     onPress={() => placeExistingPopup.setVisible(true)}
                />

                <FAB icon={"folder"}
                     variant={"secondary"}
                     label={"Folder"}
                     style={{zIndex: 100}}
                     onPress={() => folderCreatePopup.setVisible(true)}
                />
            </View>
            : null}
    </>
}
