import { tileEvents } from '@app/db/schema'
import { desc, eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Card } from 'react-native-paper'
import { Tile, TileEvent } from '../../constants/DbTypes'
import { db, InsertCallback } from '../../db/database'
import { insertTileEvent } from '../../db/tileEvents'
import { ColorWithContrast, getColorWithContrast } from '../Colors'
import { Icon } from '../Icon'
import { TileProps } from './GenericTile'
import { newTileStyles, tileStyles } from './styles'

function getDurationFromSecond(seconds: number): string {
    const minutes = Math.floor(seconds / 60)

    if (seconds < 0) {
        return ""
    }

    if (seconds < 60) {
        return `${seconds.toFixed(0)}s`
    }

    if (minutes < 60) {
        return `${minutes}min`
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `${hours}h`
    }

    const days = Math.floor(hours / 24)
    if (days < 30) {
        return `${days}d`
    }

    const months = Math.floor(days / 30)
    if (months < 12) {
        return `${months}m, ${hours % 24}d`
    }
}

type TileComponentProps = {
    tile: Tile,
    isEditMode: boolean,
    onPressInEditMode: () => void
    isOnDashboard?: boolean
} & TileProps
export const TileComponent = ({ tile, numColumns, isEditMode, onPressInEditMode, isOnDashboard = false }: TileComponentProps) => {
    const [lastEvent, setLastEvent] = useState<TileEvent>()
    const { data: events } = useLiveQuery(db().select().from(tileEvents).where(eq(tileEvents.tileId, tile.id)).orderBy(desc(tileEvents.timestamp)))
    useEffect(() => {
        setLastEvent(events[0])
    }, [events])

    const addToCounter = () => {
        const callback: InsertCallback = (err, res) => {
            if (err) {
                console.error("Error inserting tile event: ", err)
            } else {
                console.info("Inserted tile event: ", res)

                tile.events.push(event)
            }
        }

        const event: TileEvent = { data: "", timestamp: new Date(), tileId: tile.id }
        insertTileEvent(tile.id, new Date(), "", callback)
        setLastEvent(event)
    }
    const onPress = (isEditMode) ? onPressInEditMode : addToCounter

    const [color, setColor] = useState<ColorWithContrast>({ color: "#000000", contrastColor: "#000000" })
    const updateColor = async (c: ColorWithContrast) => { setColor(c) }
    useEffect(() => {
        updateColor(getColorWithContrast(tile.color))
    }, [tile.color])

    return (
        <>
            <Card style={{
                ...newTileStyles.pageTile,
                backgroundColor: color.color,
            }} onPress={onPress}>
                <Text style={{ ...tileStyles.name, color: color.contrastColor }}>{tile.name}</Text>
                <Text style={{ ...tileStyles.info, color: color.contrastColor }}>{tile.events.length}</Text>

                <DurationLastEventDisplay lastEvent={lastEvent} color={color} />
            </Card>
        </>
    )
}

const DurationLastEventDisplay: React.FC<{ lastEvent: TileEvent, color: ColorWithContrast }> = ({ lastEvent, color }) => {
    const getDurationText = (event: TileEvent) => {
        const duration = (Date.now() - event.timestamp.getTime())
        return getDurationFromSecond(duration / 1000)
    }

    const [time, setTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 1000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    return (
        <View style={tileStyles.infoContainer}>
            <Text style={{ ...tileStyles.info2, color: color.contrastColor }}>{lastEvent ? getDurationText(lastEvent) : "no events"}</Text>
            <Icon styles={tileStyles.infoIcon} iconName={"clockOutline"} iconSize={15} color={color.contrastColor} />
        </View>
    )
}