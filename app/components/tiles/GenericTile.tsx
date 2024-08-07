import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { ElementTypeNames, ElementType, Page, RoutineOnPage, Tile, isPage, isRoutineOnPage, isTile } from '../../constants/DbTypes'
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
import { DashboardList } from '../../Dashboard'
import { showToast } from '../../util/comms'

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
    dashboardList?: DashboardList
}
export const GenericTile = <TElement extends ElementType>({ element, doAfterEdit, isEditMode, onPressDelete, numColumns, isOnDashboard = false, dashboardList: dashboardList2 }: GenericTileProps<TElement>) => {
    const useIfElementType = (element: ElementType, tileValue: any, routineValue: any, pageValue: any,) => {
        if (isTile(element)) return tileValue
        if (isRoutineOnPage(element)) return routineValue
        if (isPage(element)) return pageValue
    }

    const dashboardList = dashboardList2 ?? { list: [], setList: () => { } }
    const elementType: ElementTypeNames = useIfElementType(element, "Tile", "Routine", "Page")
    const checkIfOnList = () => dashboardList.list.some((el) => el && el.elementId === element.id && el.elementType === elementType)
    const addToList = () => { if (!checkIfOnList()) dashboardList.setList([...dashboardList.list, { elementId: element.id, elementType: elementType, timeAdded: new Date() }]) }
    const removeFromList = () => { if (checkIfOnList) dashboardList.setList(dashboardList.list.filter((el) => el.elementId !== element.id)) }

    const link = useIfElementType(
        element,
        "",
        `/routines/${element.id}`,
        `/pages/${element.id}`,
    )

    const [elementIsOnDashboard, setElementIsOnDashboard] = useState(false)
    useEffect(() => {
        checkIfElementOnDashboard(element).then((res) => setElementIsOnDashboard(res))
    }, [])

    const title = useIfElementType(element, "Edit Tile", "Edit Routine", "Edit Page",)
    const saveOnClick = useIfElementType(
        element,
        () => { updateTile(element as Tile, (_err, _res) => { }) },
        () => { updateRoutine(element, (_err, _res) => { }) },
        () => { updatePage(element, (_err, _res) => { }) },
    )

    const addToDashboard = () => {
        addToList()
        setElementIsOnDashboard(true)
        addElementToDashboard(element, (error, res) => {
            if (error) {
                setElementIsOnDashboard(false)
                removeFromList()
                showToast("Error adding to dashboard!")
            }
        })
        showToast("Added to dashboard!")
    }

    const removeFromDashboard = () => {
        removeFromList()
        setElementIsOnDashboard(false)
        removeElementFromDashboard(element, (err, res) => {
            if (err) { showToast("ERROR removing to dashboard!"); console.error(err); addToList() }
            else console.log("removed from dashboard")
        })
        showToast("Removed from dashboard!")
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

    return (
        <View style={{
            display: 'flex', flexDirection: "column",
            flex: getFlex(numColumns), flexGrow: getFlex(numColumns),
            aspectRatio: 1,
            margin: 8
        }}>
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