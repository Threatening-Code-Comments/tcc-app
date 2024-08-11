import { getColorWithContrast } from '@app/components/Colors'
import { Tile, TileEvent } from '@app/constants/DbTypes'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Card, Icon, Text } from 'react-native-paper'

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

    // if (!events) { console.log("returning null in TileEventCard"); return null }

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
        day: 'numeric',
        month: 'numeric',
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
    const [expanded, setExpanded] = useState(true)

    if (!events || events.length === 0 || events[0] === undefined) { console.log("returning :("); return null; }

    const onPress = () => setExpanded(p => !p)

    // const AnimatedCard = withAnimated(Card)

    return (
        <Card elevation={5}>
            <View style={dayDisplayStyles.container} onTouchStart={onPress}>
                <Text style={dayDisplayStyles.date}>{getDayString(events[0].timestamp)}</Text>
                <Text style={dayDisplayStyles.eventCount}>{events.length}</Text>
                <Button
                // onPress={onPress}
                >
                    <Icon size={12} source={(expanded) ? "arrow-down" : "arrow-up"} />
                </Button>
            </View>
            {!expanded ? null :
                events.map((e, i) => (
                    <View
                        style={dayDisplayStyles.eventsContainer}
                        key={i + e.timestamp.toISOString() + e.tileId}
                    >
                        <Text style={dayDisplayStyles.eventText} >{formatTimestamp(e.timestamp).slice(7)}</Text>
                        <View style={{ width: 30, aspectRatio: 1, backgroundColor: 'red' }} />
                    </View>
                ))
            }
        </Card>
    )
}

const dayDisplayStyles = StyleSheet.create({
    container: {
        display: 'flex', flexDirection: 'row', alignContent: 'space-between'
    },
    eventsContainer: {
        display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', margin: 5
    },
    date: {
        flex: 3, textAlign: 'center', fontSize: 20
    }, eventCount: {
        flex: 1, textAlign: 'right', fontSize: 15
    }, eventText: {
        flexGrow: 1, textAlign: 'center'
    }
})