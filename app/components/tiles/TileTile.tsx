import { tileEvents } from '@app/db/schema'
import { showToast } from '@app/util/comms'
import { Popup } from '@components/popup/Popup'
import { desc, eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import React, { useEffect, useState } from 'react'
import { PixelRatio, Text, View } from 'react-native'
import { Card } from 'react-native-paper'
import { Tile, TileEvent } from '../../constants/DbTypes'
import { db, InsertCallback } from '../../db/database'
import { insertTileEvent } from '../../db/tileEvents'
import { ColorWithContrast, getColorWithContrast } from '../Colors'
import { Icon } from '../Icon'
import { PopupElement } from '../popup/PopupTypeDefs'
import { TileProps } from './GenericTile'
import { newTileStyles, tileStyles } from './styles'

function getDurationFromSecond(seconds: number): string {
    const floor = (i: number) => Math.floor(i)
    const minutes = floor(seconds / 60)

    if (seconds < 0) {
        return ""
    }

    if (seconds < 60) {
        return `${seconds.toFixed(0)}s`
    }

    if (minutes < 60) {
        const rest = seconds - minutes * 60
        return `${minutes}min ${floor(rest)}s`
    }

    const hours = floor(minutes / 60)
    if (hours < 24) {
        const rest = minutes - hours * 60
        return `${hours}h ${floor(rest)}min`
    }

    const days = floor(hours / 24)
    if (days < 30) {
        const rest = hours - days * 24
        return `${days}d ${floor(rest)}h`
    }

    const months = Math.floor(days / 30)
    if (months < 12) {
        return `${months}m, ${floor(hours % 24)}d`
    }
}

type TileComponentProps = {
    tile: Tile,
    isEditMode: boolean,
    onPressInEditMode: () => void
    isOnDashboard?: boolean
} & TileProps
export const TileComponent = ({ tile, numColumns = 3, isEditMode, onPressInEditMode, isOnDashboard = false }: TileComponentProps) => {
    const [pressable, setPressable] = useState(true)
    const [lastEvent, setLastEvent] = useState<TileEvent>()
    const { data: events } = useLiveQuery(db().select().from(tileEvents).where(eq(tileEvents.tileId, tile.id)).orderBy(desc(tileEvents.timestamp)))
    useEffect(() => {
        setLastEvent(events[0])
    }, [events])

    const addToCounter = () => {
        if (!pressable) {
            return
        }
        setPressable(false)

        const callback: InsertCallback = (err, res) => {
            if (err) {
                // console.error("Error inserting tile event: ", err)
                showToast("Error inserting tile event")
            } else {
                // console.info("Inserted tile event: ", res)
                showToast("Inserted tile event")

                window.setTimeout(() => {
                    setPressable(true)
                }, 750)

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

    const [infoPopupVisible, setInfoPopupVisible] = useState(false)
    const popupContent: PopupElement[] = [
        { type: 'textfield', label: 'Name', value: tile.name, onChange: (value) => { tile.name = value } },
    ]

    const getNameSize = () => {
        // fraction if the tile is smaller (eg. 3/4)
        const numColumnMultiplier = 3 / numColumns // designed for 3 columns

        const shortLength = 10 * numColumnMultiplier
        const mediumLength = 12 * numColumnMultiplier

        let size: number
        if (tile.name.length < shortLength)
            size = 20
        else if (tile.name.length < mediumLength)
            size = 18 //18
        else
            size = 15


        return size * numColumnMultiplier * PixelRatio.getFontScale()
    }

    return (
        <>
            <Popup
                color={tile.color}
                isOpen={infoPopupVisible}
                setModalOpen={setInfoPopupVisible}
                content={popupContent} />
            <Card style={{
                // ...newTileStyles.pageTile,
                backgroundColor: color.color,

                // display: 'flex',
                height: '100%', aspectRatio: 1,
                alignItems: 'center', justifyContent: 'flex-start',
                padding: 5

            }} onPress={onPress} onLongPress={() => setInfoPopupVisible(true)}>
                <Text style={{
                    ...tileStyles.name,
                    fontSize: getNameSize(),
                    color: color.contrastColor,
                }} ellipsizeMode='tail' numberOfLines={2}>{tile.name}</Text>
                <Text style={{
                    ...tileStyles.info,
                    color: color.contrastColor,
                    marginTop: 'auto'
                }}>{tile.events.length}</Text>

                <View style={{ bottom: 0, position: 'absolute', right: 0 }}>
                    <DurationLastEventDisplay lastEvent={lastEvent} color={color} />
                </View>
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