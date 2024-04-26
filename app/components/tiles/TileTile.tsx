import React, { useEffect, useState } from 'react'
import { Pressable, Text } from 'react-native'
import { Tile, TileEvent } from '../../constants/DbTypes'
import { InsertCallback } from '../../db/database'
import { getEventsForTiles, insertTileEvent } from '../../db/tileEvents'
import { TileProps } from './GenericTile'
import { tileStyles } from './styles'
import { getFlex } from './util'
import { ComponentTypeDisplay } from './ComponentTypeDisplay'

function getDurationFromSecond(seconds: number): string {
    const minutes = Math.floor(seconds / 60)

    if (minutes < 60) {
        return `${minutes}min ago`
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `${hours}h ago`
    }

    const days = Math.floor(hours / 24)
    if (days < 30) {
        return `${days}d ago`
    }

    const months = Math.floor(days / 30)
    if (months < 12) {
        return `${months}m, ${hours % 24}d ago`
    }
}

type TileComponentProps = {
    tile: Tile,
    isEditMode: boolean,
    onPressInEditMode: () => void
    isOnDashboard?: boolean
} & TileProps
export const TileComponent = ({ tile, numColumns, isEditMode, onPressInEditMode, isOnDashboard = false }: TileComponentProps) => {
    const [counter, setCounter] = useState(tile.counter)
    const [lastEvent, setLastEvent] = useState<TileEvent>()

    useEffect(() => {
        getEventsForTiles([tile.id], (err, res) => {
            getEventsForTiles([tile.id], (err, res) => {
                const lastEvent = res.reduce((prev, curr) => prev.timestamp > curr.timestamp ? prev : curr)
                setLastEvent(lastEvent)
            });
        })
    })

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
        const event: TileEvent = {data: "", timestamp: new Date(), tileId: tile.id}
        insertTileEvent(tile.id, new Date(), "", callback)
        setLastEvent(event)
    }
    const onPress = (isEditMode) ? onPressInEditMode : addToCounter

    const duration = Date.now() - lastEvent.timestamp.getTime()

    return (
        <>
            <ComponentTypeDisplay display={isOnDashboard} text='T' />
            <Pressable style={[tileStyles.card, { flex: getFlex(numColumns), flexGrow: 1 }]} onPress={onPress}>
                <Text style={tileStyles.name}>{tile.name}</Text>
                <Text style={tileStyles.info}>{counter}</Text>
                <Text style={tileStyles.info}>{getDurationFromSecond(duration)}</Text>
            </Pressable>
        </>
    )
}