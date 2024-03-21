import React from 'react'
import { Text, View } from 'react-native'
import { RoutineOnPage } from '../../constants/DbTypes'
import { TileProps } from './GenericTile'
import { getFlex, DeleteButton, LinkOrPressable } from './util'
import { tileStyles } from './styles'
import { ComponentTypeDisplay } from './ComponentTypeDisplay'

type RoutineTileComponentProps = {
    routine: RoutineOnPage,
    isEditMode: boolean,
    onPress: () => void,
    onPressDelete: () => void,
    isOnDashboard?: boolean
} & TileProps
export const RoutineTileComponent = ({ routine, numColumns, isEditMode, onPressDelete, onPress, isOnDashboard = false }: RoutineTileComponentProps) => {
    const length = (routine.tiles) ? routine.tiles.length : 0

    return (
        <View style={{ display: 'flex', flexDirection: 'column', flex: getFlex(numColumns) }}>
            <ComponentTypeDisplay display={isOnDashboard} text="R" />
            <DeleteButton isEditMode={isEditMode} onPress={onPressDelete} />
            <LinkOrPressable style={[tileStyles.card]} link={`/routines/${routine.id}`} isLink={!isEditMode} onPress={onPress} >
                <Text style={tileStyles.name}>{routine.name}</Text>
                <Text style={tileStyles.info}>Has {length} Tiles</Text>
            </LinkOrPressable>
        </View>
    )
}