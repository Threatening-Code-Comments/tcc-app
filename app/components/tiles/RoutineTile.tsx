import React, { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { Card } from 'react-native-paper'
import { RoutineOnPage } from '../../constants/DbTypes'
import { ColorWithContrast, getColorWithContrast } from '../Colors'
import { TileProps } from './GenericTile'
import { newTileStyles, tileStyles } from './styles'
import { LinkOrPressable } from './util'

type RoutineTileComponentProps = {
    routine: RoutineOnPage,
    isEditMode: boolean,
    onPress: () => void,
    onPressDelete: () => void,
    isOnDashboard?: boolean
} & TileProps
export const RoutineTileComponent = ({ routine, numColumns, isEditMode, onPressDelete, onPress, isOnDashboard = false }: RoutineTileComponentProps) => {
    const length = (routine.tiles) ? routine.tiles.length : 0

    const [color, setColor] = useState<ColorWithContrast>({ color: "#000000", contrastColor: "#000000" })
    const updateColor = async (c: ColorWithContrast) => { setColor(c) }
    useEffect(() => {
        updateColor(getColorWithContrast(routine.color))
    }, [routine.color])

    return (
        <Card style={{
            ...newTileStyles.pageTile,
            borderColor: color.color, borderWidth: 5,
            margin: -2.5
        }}>
            <LinkOrPressable style={newTileStyles.linkOrPressable} link={`/routines/${routine.id}`} isLink={!isEditMode} onPress={onPress} >
                <Text style={tileStyles.name}>{routine.name}</Text>
                <Text style={{ ...tileStyles.info, color: color.color }}>{length} Tiles</Text>
            </LinkOrPressable>
        </Card >
    )
}