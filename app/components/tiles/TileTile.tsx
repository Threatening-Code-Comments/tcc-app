import React, { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { Tile } from '../../constants/DbTypes'
import { InsertCallback } from '../../db/database'
import { insertTileEvent } from '../../db/tileEvents'
import { TileProps } from './GenericTile'
import { tileStyles } from './styles'
import { getFlex } from './util'
import { ComponentTypeDisplay } from './ComponentTypeDisplay'

type TileComponentProps = {
    tile: Tile,
    isEditMode: boolean,
    onPressInEditMode: () => void
    isOnDashboard?: boolean
} & TileProps
export const TileComponent = ({ tile, numColumns, isEditMode, onPressInEditMode, isOnDashboard = false }: TileComponentProps) => {
    const [counter, setCounter] = useState(tile.counter)

    const addToCounter = () => {
        const callback: InsertCallback = (err, res) => {
            if (err) {
                console.error("Error inserting tile event: ", err)
            } else {
                console.info("Inserted tile event: ", res)

                tile.counter += 1
                setCounter(tile.counter)
            }
        }

        insertTileEvent(tile.id, new Date(), "", callback)
    }
    const onPress = (isEditMode) ? onPressInEditMode : addToCounter

    return (
        <>
            <ComponentTypeDisplay display={isOnDashboard} text='T' />
            <Pressable style={[tileStyles.card, { flex: getFlex(numColumns), flexGrow: 1 }]} onPress={onPress}>
                <Text style={tileStyles.name}>{tile.name}</Text>
                <Text style={tileStyles.info}>{counter}</Text>
            </Pressable>
        </>
    )
}