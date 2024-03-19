import React from 'react'
import { View } from 'react-native'
import { Page, RoutineOnPage, Tile } from '../../constants/DbTypes'
import { updatePage } from '../../db/pages'
import { updateRoutine } from '../../db/routines'
import { updateTile } from '../../db/routineTiles'
import { useModal } from '../modal/Modal'
import { PageTileComponent } from './PageTile'
import { RoutineTileComponent } from './RoutineTile'
import { TileComponent } from './TileTile'
import { getFlex, DeleteButton } from './util'


export type TileProps = {
    numColumns?: number
}


type ElementType = Page | RoutineOnPage | Tile

type GenericTileProps<TElement extends ElementType> = {
    element: TElement,
    isEditMode: boolean,
    numColumns: number,
    onPressDelete: () => void,
    doAfterEdit: (element: TElement) => void
}
const isTile = <TElement extends ElementType>(element: TElement): element is TElement & Tile => {
    return "rootRoutineId" in element;
}

const isRoutineOnPage = <TElement extends ElementType>(element: TElement): element is TElement & RoutineOnPage => {
    return "pageId" in element;
}

const isPage = <TElement extends ElementType>(element: TElement): element is TElement & Page => {
    return !isTile(element) && !(isRoutineOnPage(element));
}
export const GenericTile = <TElement extends ElementType>({ element, doAfterEdit, isEditMode, onPressDelete, numColumns }: GenericTileProps<TElement>) => {
    let link = ""
    if (isTile(element)) {
        const t = element;
        link = ``
    }
    if (isRoutineOnPage(element)) {
        const t = element;
        link = `/routines/${element.id}`
    }
    if (isPage(element)) {
        const t = element;
        link = `/pages/${element.id}`
    }

    const title = (isTile(element)) ? "Edit Tile" : (isRoutineOnPage(element)) ? "Edit Routine" : "Edit Page"
    const saveOnClick = (isTile(element))
        ? () => { updateTile(element, (_err, _res) => { }) }
        : (isRoutineOnPage(element))
            ? () => { updateRoutine(element, (_err, _res) => { }) }
            : () => { updatePage(element, (_err, _res) => { }) }

    const editElementModal = useModal({
        title: title,
        inputTypes: {
            "Name": { type: "string", value: element.name },
            "Save": {
                type: "button",
                icon: 'save',
                onClick: () => {
                    console.log("halli hallo")
                    element.name = editElementModal.inputStates["Name"]
                    doAfterEdit(element)
                    saveOnClick()
                    editElementModal.setVisible(false)
                }
            }
        }
    })
    const displayModal = () => editElementModal.setVisible(true)

    return (
        <View style={{ display: 'flex', flexDirection: 'column', flex: getFlex(numColumns) }}>
            {editElementModal.component}
            <DeleteButton isEditMode={isEditMode} onPress={onPressDelete} />
            {isTile(element)
                ? <TileComponent tile={element} numColumns={numColumns} onPressInEditMode={displayModal} isEditMode={isEditMode} />
                : isRoutineOnPage(element)
                    ? <RoutineTileComponent routine={element} numColumns={numColumns} onPress={displayModal} isEditMode={isEditMode} onPressDelete={onPressDelete} />
                    : <PageTileComponent page={element} numColumns={numColumns} onPress={displayModal} isEditMode={isEditMode} onPressDelete={onPressDelete} />}
        </View>
    )
}