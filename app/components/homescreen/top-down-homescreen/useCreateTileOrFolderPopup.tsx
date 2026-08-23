import React, {useEffect, useState} from "react";
import {usePopup} from "@components/hooks/usePopup";
import {Text, TextInput} from "react-native-paper";
import {HS3Element, HS3Folder, HS3Item, HS3LayoutParams, PixelPoint} from "@homescreen/types";
import {TextField} from "rn-material-ui-textfield";
import {clamp, getItemPath, getNextId} from "@homescreen/top-down-homescreen/top-down-util";
import {IconButton} from "@components/IconButton";
import {View} from "react-native";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {runOnJS, useDerivedValue, useSharedValue} from "react-native-reanimated";
import {GRID_COLUMNS, pixelToGrid, pxToGrid} from "@homescreen/move_algo";

type Props = {
    folders: HS3Folder[],
    currentLevel: number
    onSubmit: (item: HS3Item) => void
}

export const useCreateTilePopup = (props: Props) => {
    const {folders, currentLevel, onSubmit: onSubmitP} = props

    const [name, setName] = React.useState<string>("");

    const onSubmit = () => {
        popup.setVisible(false)
        onSubmitP({
            name, parentId: currentLevel, itemId: getNextId("item", folders), layout: {
                x: 0, y: 0, width: 0, height: 0
            }
        })
    }

    // const newTileId =
    const parent = folders.find(f => f.folderId === currentLevel)
    const popupContent = (<View style={{display: 'flex', flexDirection: 'column', gap: 20}}>
        <Text variant={"headlineSmall"}>Create Tile</Text>
        <Text>Parent: {getItemPath(parent, folders)}</Text>

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
                        zIndex: 20, backgroundColor: '#ffff0055'
                    }}>
                    <View
                        style={{
                            display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-around',
                            marginTop: -20
                        }}>
                        <IconButton iconName={"save"} text={"Save"}
                                    disabled={!elementBuffer.value}
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
    }, [elementToCreate, !!elementBuffer.value])


    return {
        component,
        setElement
    }
}