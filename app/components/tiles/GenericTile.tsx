import React, { useEffect, useState } from 'react'
import Animated from 'react-native-reanimated'
import { ElementType, Tile, isPage, isRoutineOnPage, isTile } from '../../constants/DbTypes'
import { updatePage } from '../../db/pages'
import { updateRoutine } from '../../db/routines'
import { updateTile } from '../../db/tiles'
import { useModal } from '../modal/Modal'
import { PageTileComponent } from './PageTile'
import { RoutineTileComponent } from './RoutineTile'
import { TileComponent } from './TileTile'
import { DeleteButton, getFlex } from './util'
import { Modal, Pressable, View, StyleSheet, Text } from 'react-native'
import { modalStyles } from '../modal/ModalStyles'

export type TileProps = {
    numColumns?: number
}

type GenericTileProps<TElement extends ElementType> = {
    element: TElement,
    isEditMode: boolean,
    numColumns: number,
    onPressDelete: () => void,
    doAfterEdit: (element: TElement) => void
    isOnDashboard?: boolean,
}
//the old dashboard (and its "star to add" button here) is gone — the homescreen replaced it
export const GenericTile = <TElement extends ElementType>({ element, doAfterEdit, isEditMode, onPressDelete, numColumns, isOnDashboard = false }: GenericTileProps<TElement>) => {
    const useIfElementType = (element: ElementType, tileValue: any, routineValue: any, pageValue: any,) => {
        if (isTile(element)) return tileValue
        if (isRoutineOnPage(element)) return routineValue
        if (isPage(element)) return pageValue
    }

    const link = useIfElementType(
        element,
        "",
        `/routines/${element.id}`,
        `/pages/${element.id}`,
    )

    const title = useIfElementType(element, "Edit Tile", "Edit Routine", "Edit Page",)
    const saveOnClick = useIfElementType(
        element,
        () => { updateTile(element as Tile, (_err, _res) => { }) },
        () => { updateRoutine(element, (_err, _res) => { }) },
        () => { updatePage(element, (_err, _res) => { }) },
    )

    const onSave = (data) => {
        element.name = data.Name
        doAfterEdit(element)
        saveOnClick()
        editElementModal.setVisible(false)
    }

    const displayModal = () => editElementModal.setVisible(true)
    const editElementModal = useModal<{
        "Name": "string"
        "Color": "slider-color"
        "Save": "submit"
    }>({
        title: title,
        inputTypes: {
            "Name": { type: "string", value: element.name },
            "Color": { type: "slider-color", value: element.color },
            "Save": {
                type: "submit",
                icon: 'save',
                onClick: (data) => {
                    element.name = data.Name
                    element.color = data.Color
                    doAfterEdit(element)
                    saveOnClick()
                    editElementModal.setVisible(false)
                }
            },
        }
    })

    const [popupIsVisible, popupSetVisible] = useState(true)

    return (
        <Animated.View style={{
            display: 'flex', flexDirection: "column",
            flex: getFlex(numColumns), flexGrow: getFlex(numColumns),
            aspectRatio: 1,
            margin: 8
        }}>
            {editElementModal.component}
            <DeleteButton isEditMode={isEditMode} onPress={onPressDelete} />
            {isTile(element)
                ? <TileComponent tile={element} numColumns={numColumns} onPressInEditMode={displayModal} isEditMode={isEditMode} isOnDashboard={isOnDashboard} />
                : isRoutineOnPage(element)
                    ? <RoutineTileComponent routine={element} numColumns={numColumns} onPress={displayModal} isEditMode={isEditMode} onPressDelete={onPressDelete} isOnDashboard={isOnDashboard} />
                    : <PageTileComponent page={element} numColumns={numColumns} onPress={displayModal} isEditMode={isEditMode} onPressDelete={onPressDelete} isOnDashboard={isOnDashboard} />}
        </Animated.View>
    )
}