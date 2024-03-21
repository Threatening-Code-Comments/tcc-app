import React from 'react'
import { View } from 'react-native'
import { ElementType, Page, RoutineOnPage, Tile, isPage, isRoutineOnPage, isTile } from '../../constants/DbTypes'
import { updatePage } from '../../db/pages'
import { updateRoutine } from '../../db/routines'
import { updateTile } from '../../db/tiles'
import { useModal } from '../modal/Modal'
import { PageTileComponent } from './PageTile'
import { RoutineTileComponent } from './RoutineTile'
import { TileComponent } from './TileTile'
import { getFlex, DeleteButton } from './util'
import { addElementToDashboard } from '../../db/dashboard'

export type TileProps = {
    numColumns?: number
}

type GenericTileProps<TElement extends ElementType> = {
    element: TElement,
    isEditMode: boolean,
    numColumns: number,
    onPressDelete: () => void,
    doAfterEdit: (element: TElement) => void
    orientation?: "column" | "row",
    isOnDashboard?: boolean
}

export const GenericTile = <TElement extends ElementType>({ element, doAfterEdit, isEditMode, onPressDelete, numColumns, orientation = "column", isOnDashboard = false }: GenericTileProps<TElement>) => {
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

    const title = (isTile(element)) ? "Edit Tile" : (isRoutineOnPage(element)) ? "Edit Routine" : "Edit Page"
    const saveOnClick = (isTile(element))
        ? () => { updateTile(element, (_err, _res) => { }) }
        : (isRoutineOnPage(element))
            ? () => { updateRoutine(element, (_err, _res) => { }) }
            : () => { updatePage(element, (_err, _res) => { }) }

    const editElementModal = useModal<{
        "Name": "string"
        "Add to Dashboard": "button"
        "Save": "submit"
    }>({
        title: title,
        inputTypes: {
            "Name": { type: "string", value: element.name },
            "Add to Dashboard": {
                icon: "star",
                onClick: () => addElementToDashboard(element, (error, res) => console.log("added to dashboard", error, res)),
                type: "button"
            },
            "Save": {
                type: "submit",
                icon: 'save',
                onClick: (data) => {
                    element.name = data.Name
                    doAfterEdit(element)
                    saveOnClick()
                    editElementModal.setVisible(false)
                }
            }
        }
    })
    const displayModal = () => editElementModal.setVisible(true)

    return (
        <View style={{ display: 'flex', flexDirection: orientation, flex: getFlex(numColumns), aspectRatio: 1, margin: 5 }}>
            {editElementModal.component}
            <DeleteButton isEditMode={isEditMode} onPress={onPressDelete} />
            {isTile(element)
                ? <TileComponent tile={element} numColumns={numColumns} onPressInEditMode={displayModal} isEditMode={isEditMode} isOnDashboard={isOnDashboard} />
                : isRoutineOnPage(element)
                    ? <RoutineTileComponent routine={element} numColumns={numColumns} onPress={displayModal} isEditMode={isEditMode} onPressDelete={onPressDelete} isOnDashboard={isOnDashboard} />
                    : <PageTileComponent page={element} numColumns={numColumns} onPress={displayModal} isEditMode={isEditMode} onPressDelete={onPressDelete} isOnDashboard={isOnDashboard} />}
        </View>
    )
}