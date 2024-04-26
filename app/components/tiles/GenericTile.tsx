import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { ElementType, Page, RoutineOnPage, Tile, isPage, isRoutineOnPage, isTile } from '../../constants/DbTypes'
import { updatePage } from '../../db/pages'
import { updateRoutine } from '../../db/routines'
import { updateTile } from '../../db/tiles'
import { useModal } from '../modal/Modal'
import { PageTileComponent } from './PageTile'
import { RoutineTileComponent } from './RoutineTile'
import { TileComponent } from './TileTile'
import { getFlex, DeleteButton, DashboardButton } from './util'
import { addElementToDashboard, checkIfElementOnDashboard, removeElementFromDashboard } from '../../db/dashboard'
import { IconName } from '../IconButton'
import { UseModalStateType } from '../modal/ModalTypeDefs'

export type TileProps = {
    numColumns?: number
}

type GenericTileProps<TElement extends ElementType> = {
    element: TElement,
    isEditMode: boolean,
    numColumns: number,
    onPressDelete: () => void,
    doAfterEdit: (element: TElement) => void
    isOnDashboard?: boolean
}
export const GenericTile = <TElement extends ElementType>({ element, doAfterEdit, isEditMode, onPressDelete, numColumns, isOnDashboard = false }: GenericTileProps<TElement>) => {
    let link = ""
    if (isTile(element)) {
        link = ``
    }
    if (isRoutineOnPage(element)) {
        link = `/routines/${element.id}`
    }
    if (isPage(element)) {
        link = `/pages/${element.id}`
    }
    const [elementIsOnDashboard, setElementIsOnDashboard] = useState(false)
    useEffect(() => {
        checkIfElementOnDashboard(element).then((res) => setElementIsOnDashboard(res))
    }, [])

    const title = (isTile(element)) ? "Edit Tile" : (isRoutineOnPage(element)) ? "Edit Routine" : "Edit Page"
    const saveOnClick = (isTile(element))
        ? () => { updateTile(element, (_err, _res) => { }) }
        : (isRoutineOnPage(element))
            ? () => { updateRoutine(element, (_err, _res) => { }) }
            : () => { updatePage(element, (_err, _res) => { }) }

    const addToDashboard = () => {
        setElementIsOnDashboard(true)
        addElementToDashboard(element, (error, res) => console.log("added to dashboard", error, res))
    }

    const removeFromDashboard = () => {
        setElementIsOnDashboard(false)
        removeElementFromDashboard(element, () => { console.log("removed from dashboard") })
    }

    const onSave = (data) => {
        element.name = data.Name
        doAfterEdit(element)
        saveOnClick()
        editElementModal.setVisible(false)
    }

    const displayModal = () => editElementModal.setVisible(true)
    const editElementModal = useModal<{
        "Name": "string"
        "Save": "submit"
    }>({
        title: title,
        inputTypes: {
            "Name": { type: "string", value: element.name },
            "Save": {
                type: "submit",
                icon: 'save',
                onClick: (data) => {
                    element.name = data.Name
                    doAfterEdit(element)
                    saveOnClick()
                    editElementModal.setVisible(false)
                }
            },
        }
    })

    return (
        <View style={{ display: 'flex', flexDirection: "column", flex: getFlex(numColumns), aspectRatio: 1, margin: 5 }}>
            {editElementModal.component}
            <DeleteButton isEditMode={isEditMode} onPress={onPressDelete} />
            <DashboardButton isEditMode={isEditMode} onPress={elementIsOnDashboard ? removeFromDashboard : addToDashboard} isOnDashboard={elementIsOnDashboard} />
            {isTile(element)
                ? <TileComponent tile={element} numColumns={numColumns} onPressInEditMode={displayModal} isEditMode={isEditMode} isOnDashboard={isOnDashboard} />
                : isRoutineOnPage(element)
                    ? <RoutineTileComponent routine={element} numColumns={numColumns} onPress={displayModal} isEditMode={isEditMode} onPressDelete={onPressDelete} isOnDashboard={isOnDashboard} />
                    : <PageTileComponent page={element} numColumns={numColumns} onPress={displayModal} isEditMode={isEditMode} onPressDelete={onPressDelete} isOnDashboard={isOnDashboard} />}
        </View>
    )
}