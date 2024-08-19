import { getColorWithContrast } from '@app/components/Colors'
import { Icon } from '@app/components/Icon'
import { IconButton } from '@app/components/IconButton'
import { Tile, TileEvent } from '@app/constants/DbTypes'
import { showToast } from '@app/util/comms'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Card, Text } from 'react-native-paper'

type EventDayMap = Map<string, TileEvent[]>

type TileEventCardProps = {
    tile: Tile
}
const TileEventCard = ({ tile }: TileEventCardProps) => {
    const [events, setEvents] = useState<EventDayMap>(new Map())
    useEffect(() => {
        const eventCopy = new Map()
        tile.events.forEach(e => {
            const key = getDateWithoutTime(e.timestamp).toISOString()
            eventCopy.set(key, [...(eventCopy.get(key) || []), e])
        })
        setEvents(eventCopy)
    }, [tile])

    if (!events) { console.log("returning null in TileEventCard"); return null }

    return (
        <Card style={{ backgroundColor: tile.color }}>
            <Card.Title titleStyle={{ color: getColorWithContrast(tile.color).contrastColor }} title={tile.name} />
            <Card.Content>
                {Array.from(events.values()).map((v, i) => {
                    return <View key={"eventdisplay" + v} style={{ margin: 8 }}>
                        <EventDayDisplay events={v} />
                    </View>
                })}
            </Card.Content>
        </Card>
    )
}

const getDateWithoutTime = (d: Date) => {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
const getDayString = (timestamp: Date) => {
    return timestamp.toLocaleString('de-DE', {
        weekday: 'short',
        day: 'numeric',
        month: 'numeric'
    })
}
const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

export default TileEventCard

const EventDayDisplay = ({ events }: { events: TileEvent[] }) => {
    const [expanded, setExpanded] = useState(false)

    if (!events || events.length === 0 || events[0] === undefined) { console.log("returning :("); return null; }

    const onPress = () => setExpanded(p => !p)
    const isSameYear = new Date().getFullYear() === events[0].timestamp.getFullYear()
    const yearString = events[0].timestamp.toLocaleDateString("de-DE", { year: "2-digit" })
    // const AnimatedCard = withAnimated(Card)

    const greyBorder = { borderBottomColor: 'grey', borderBottomWidth: 2 }

    return (
        <Card elevation={5}>
            <View style={{
                ...dayDisplayStyles.container,
                ...((expanded) ? greyBorder : {})
            }} onTouchStart={onPress}>
                <View style={dayDisplayStyles.date}>
                    <Text style={dayDisplayStyles.yearDisplay}>
                        {(isSameYear) ? null : `'${yearString}`}
                    </Text>
                    <Text style={dayDisplayStyles.date}>{getDayString(events[0].timestamp)}</Text>
                </View>
                <View style={{ flexGrow: 1, display: 'flex', flexDirection: 'row', height: dateHeight, justifyContent: 'center' }}>
                    <Text style={dayDisplayStyles.eventCount}>{events.length}</Text>
                    <Icon iconSize={35} iconName={(expanded) ? "arrowDown" : "arrowUp"} />
                </View>
            </View>
            {!expanded ? null :
                events.map((e, i) => (
                    <View
                        style={dayDisplayStyles.eventsContainer}
                        key={i + e.timestamp.toISOString() + e.tileId}
                    >
                        <Text style={dayDisplayStyles.eventText} >{formatTimestamp(e.timestamp).slice(7)}</Text>
                        <IconButton style={{ ...dayDisplayStyles.button, backgroundColor: 'blue' }} iconName='edit' onPress={() => showToast('Edit!')} />
                        {/* <View style={{ ...dayDisplayStyles.button, backgroundColor: 'blue' }} /> */}
                        {/* <View style={{ ...dayDisplayStyles.button, backgroundColor: 'red' }} /> */}
                        <IconButton style={{ ...dayDisplayStyles.button, backgroundColor: 'red' }} type='error' iconName='delete' onPress={() => showToast('Delete!')} />
                    </View>
                ))
            }
        </Card>
    )
}

const dateHeight = 30
const dayDisplayStyles = StyleSheet.create({
    container: {
        display: 'flex', flexDirection: 'row', alignContent: 'space-between',
    },
    eventsContainer: {
        display: 'flex', flexDirection: 'row', justifyContent: 'space-between', margin: 5,
        borderBottomColor: 'grey',
    },
    yearDisplay: {
        fontSize: 15,
        fontStyle: 'italic',
        alignSelf: 'center'
    },
    date: {
        flex: 3, textAlign: 'center', fontSize: 17,
        display: 'flex', flexDirection: 'row',
        margin: 4,
    }, eventCount: {
        flex: 1, textAlign: 'right', fontSize: 15,
        alignSelf: 'center', justifyContent: 'center',
        fontStyle: 'italic',
        marginTop: -10,
    }, arrow: {
        alignSelf: 'center'
    },
    eventText: {
        width: '65%',
        fontSize: 17,
        textAlign: 'center',
        alignSelf: 'center'
    }, button: {
        width: dateHeight, height: dateHeight,
        alignSelf: 'center',
        flexGrow: 1,
    }
})