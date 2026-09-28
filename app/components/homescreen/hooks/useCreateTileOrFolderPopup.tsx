import React, {useEffect, useState} from "react";
import {usePopup} from "@components/hooks/usePopup";
import {Text, TextInput} from "react-native-paper";
import {HS3Element, HS3Folder, HS3Item, HS3LayoutParams, PixelPoint, Routine, Tile} from "@homescreen/types";
import {TextField} from "rn-material-ui-textfield";
import {clamp, getElementPath, getNextId, getNextTileId, getRandomColor} from "@homescreen/util";
import {getContrastColor} from "@components/Colors";
import {syncRoutineFolder} from "@homescreen/crud/routine_folders";
import {IconButton} from "@components/IconButton";
import {ScrollView, TouchableOpacity, View} from "react-native";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {runOnJS, useDerivedValue, useSharedValue} from "react-native-reanimated";
import {GRID_COLUMNS, pixelToGrid, pxToGrid} from "@homescreen/move_algo";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

type Props = {
    currentLevel: number
    onSubmit: (item: HS3Item) => void
}

//"Create Tile" here means "create a brand new library tile, and an item that places it
//here" — a new Tile is pushed into the shared tile library, then the item referencing
//it is handed to onSubmit for the caller to position on the grid.
export const useCreateTilePopup = (props: Props) => {
    const {currentLevel, onSubmit: onSubmitP} = props
    const {folders, tiles} = useHomescreenData()

    const [name, setName] = React.useState<string>("");

    const onSubmit = () => {
        popup.setVisible(false)
        setName("")

        const newTile: Tile = {
            id: getNextTileId(tiles.value),
            name,
            color: getRandomColor(),
            mode: 0,
            rootRoutineId: 0, //uncategorized in the App Drawer for now
            events: [],
        }
        tiles.value = [...tiles.value, newTile]

        onSubmitP({
            itemId: getNextId("item", folders.value),
            tileId: newTile.id,
            parentId: currentLevel,
            layout: {x: 0, y: 0, width: 0, height: 0}
        })
    }

    const parent = folders.value.find(f => f.folderId === currentLevel)
    const popupContent = (<View style={{display: 'flex', flexDirection: 'column', gap: 20}}>
        <Text variant={"headlineSmall"}>Create Tile</Text>
        <Text>Parent: {getElementPath(parent, folders.value)}</Text>

        <TextInput label={"Name"}
                   value={name}
                   onChangeText={text => setName(text)}/>

        <IconButton iconName={"add"} text={"Add"} disabled={name === ""} onPress={onSubmit}/>
    </View>)
    const popup = usePopup({children: popupContent})

    return {
        visible: popup.visible,
        setVisible: popup.setVisible,
        component: popup.component,
    }
}

type PlaceExistingProps = {
    currentLevel: number
    onSubmit: (element: HS3Element) => void
}

//The other half of "+": place something that already exists in the library, instead of
//creating a new one — the only way to get the same tile into multiple folders from here
//(BEHAVIOR.md's caffeinated-drinks-in-3-folders case). Picking a tile hands a new item
//referencing it to onSubmit; picking a routine hands over a folder live-linked to it
//(name, color and tiles follow the routine, see crud/routine_folders.ts), pre-filled so
//the placement preview already shows its contents. Either way it's then positioned with
//the same layout overlay as "Tile".
export const usePlaceExistingTilePopup = (props: PlaceExistingProps) => {
    const {currentLevel, onSubmit: onSubmitP} = props
    const {folders, tiles, routines} = useHomescreenData()

    const [query, setQuery] = React.useState<string>("")

    const onPick = (tile: Tile) => {
        popup.setVisible(false)
        setQuery("")

        onSubmitP({
            itemId: getNextId("item", folders.value),
            tileId: tile.id,
            parentId: currentLevel,
            layout: {x: 0, y: 0, width: 0, height: 0}
        })
    }

    const onPickRoutine = (routine: Routine) => {
        popup.setVisible(false)
        setQuery("")

        const linkedFolder: HS3Folder = {
            folderId: getNextId("folder", folders.value),
            name: routine.name,
            color: routine.color,
            items: [],
            routineId: routine.id,
            parentId: currentLevel,
            layout: {x: 0, y: 0, width: 0, height: 0}
        }
        onSubmitP(syncRoutineFolder(linkedFolder, folders.value, tiles.value, routines.value))
    }

    const trimmed = query.trim().toLowerCase()
    const results = tiles.value.filter(t => t.name.toLowerCase().includes(trimmed))
    const routineResults = routines.value.filter(r =>
        r.name.toLowerCase().includes(trimmed) && tiles.value.some(t => t.rootRoutineId === r.id)
    )

    const parent = folders.value.find(f => f.folderId === currentLevel)
    const popupContent = (<View style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        <Text variant={"headlineSmall"}>Place existing</Text>
        <Text>Parent: {getElementPath(parent, folders.value)}</Text>

        <TextInput label={"Search"}
                   value={query}
                   onChangeText={text => setQuery(text)}/>

        <ScrollView style={{maxHeight: 360}}>
            {routineResults.length > 0 && <>
                <Text variant={"labelLarge"} style={{marginBottom: 8, opacity: 0.8}}>Routines</Text>
                <View style={{flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16}}>
                    {routineResults.map(routine => (
                        <TouchableOpacity key={routine.id} onPress={() => onPickRoutine(routine)}>
                            {/*outlined like the App Drawer's routine folders, to read as "a group", not a tile*/}
                            <View style={{
                                paddingHorizontal: 12, paddingVertical: 8,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: routine.color,
                            }}>
                                <Text style={{color: routine.color, fontWeight: "600"}}>
                                    {routine.name} ({tiles.value.filter(t => t.rootRoutineId === routine.id).length})
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </>}
            <Text variant={"labelLarge"} style={{marginBottom: 8, opacity: 0.8}}>Tiles</Text>
            <View style={{flexDirection: "row", flexWrap: "wrap", gap: 8}}>
                {results.map(tile => (
                    <TouchableOpacity key={tile.id} onPress={() => onPick(tile)}>
                        <View style={{
                            paddingHorizontal: 12, paddingVertical: 10,
                            borderRadius: 10,
                            backgroundColor: tile.color,
                        }}>
                            <Text style={{color: getContrastColor(tile.color), fontWeight: "600"}}>
                                {tile.name}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
                {results.length === 0 && <Text style={{opacity: 0.6}}>No tiles found.</Text>}
            </View>
        </ScrollView>
    </View>)
    const popup = usePopup({children: popupContent})

    return {
        visible: popup.visible,
        setVisible: popup.setVisible,
        component: popup.component,
    }
}

type CreateFolderProps = {
    currentLevel: number
    onSubmit: (folder: HS3Folder) => void
}

//an empty folder — the drag-onto-each-other gesture already covers "folder from existing
//items", this is for setting one up ahead of time. Positioned by the same layout overlay.
export const useCreateFolderPopup = (props: CreateFolderProps) => {
    const {currentLevel, onSubmit: onSubmitP} = props
    const {folders} = useHomescreenData()

    const [name, setName] = React.useState<string>("")

    const onSubmit = () => {
        popup.setVisible(false)
        setName("")

        onSubmitP({
            folderId: getNextId("folder", folders.value),
            name,
            color: getRandomColor(),
            items: [],
            parentId: currentLevel,
            layout: {x: 0, y: 0, width: 0, height: 0}
        })
    }

    const parent = folders.value.find(f => f.folderId === currentLevel)
    const popupContent = (<View style={{display: 'flex', flexDirection: 'column', gap: 20}}>
        <Text variant={"headlineSmall"}>Create Folder</Text>
        <Text>Parent: {getElementPath(parent, folders.value)}</Text>

        <TextInput label={"Name"}
                   value={name}
                   onChangeText={text => setName(text)}/>

        <IconButton iconName={"add"} text={"Add"} disabled={name === ""} onPress={onSubmit}/>
    </View>)
    const popup = usePopup({children: popupContent})

    return {
        visible: popup.visible,
        setVisible: popup.setVisible,
        component: popup.component,
    }
}

type CreateLayoutProps = {
    //false while the dragged-out layout can't be placed — disables Save
    canConfirm: boolean
    onStart: (layout: HS3Element, coordinate: PixelPoint) => void;
    onUpdate: (layout: HS3Element, coordinate: PixelPoint) => void
    onConfirm: (layout: HS3Element) => void
    onCancel: () => void
}
export const useCreateLayoutOverlay = (props: CreateLayoutProps) => {
    const [elementToCreate, setElement] = useState<HS3Element | undefined>(undefined)
    const [component, setComponent] = useState<React.ReactNode | undefined>(undefined)

    const elementBuffer = useSharedValue(null)
    const startCoordinates = useSharedValue(null)

    const dismiss = () => {
        setElement(undefined)
        elementBuffer.value = undefined
        startCoordinates.value = undefined
    }
    const cancel = () => {
        runOnJS(props.onCancel)()
        dismiss()
    }

    const dragGesture = Gesture.Pan()
        .onStart((e) => {
            const coordinates = pixelToGrid({
                x: e.x - e.translationX,
                y: e.y - e.translationY,
            })
            startCoordinates.value = coordinates

            const newElement = {
                ...elementToCreate,
                layout: {
                    ...coordinates,
                    width: 1, height: 1
                }
            }

            elementBuffer.value = newElement

            runOnJS(props.onStart)(newElement, coordinates);
        })
        .onUpdate((e) => {
            const newElement = {
                ...(elementBuffer.value || elementToCreate),
                layout: {
                    ...startCoordinates.value,
                    width: pxToGrid(e.translationX) + 1,
                    height: pxToGrid(e.translationY) + 1
                }
            }
            elementBuffer.value = newElement

            runOnJS(props.onUpdate)(newElement, {x: e.x, y: e.y})
        })
        .onEnd((e) => {
            // runOnJS(setElement)(null)
        })

    useEffect(() => {
        if (!!elementToCreate) {
            console.log("actual element, changing!")
            setComponent(<GestureDetector gesture={dragGesture}>
                <View
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        zIndex: 20, backgroundColor: '#00000033'
                    }}>
                    <View
                        style={{
                            display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-around',
                            marginTop: -20
                        }}>
                        <IconButton iconName={"save"} text={"Save"}
                                    disabled={!elementBuffer.value || !props.canConfirm}
                                    onPress={() => {
                                        props.onConfirm(elementBuffer.value)
                                        dismiss()
                                    }}/>

                        <IconButton iconName={"close"} text={"Cancel"}
                                    type={"error"}
                                    onPress={() => cancel()}/>
                    </View>
                </View>
            </GestureDetector>)
        } else {
            setComponent(null)
        }
    }, [elementToCreate, !!elementBuffer.value, props.canConfirm])


    return {
        component,
        setElement
    }
}