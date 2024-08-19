import { RoutineWithTiles, TileEvent, TileOfRoutine } from "@app/constants/DbTypes"
import { db } from "@app/db/database"
import { useLiveQuery } from "drizzle-orm/expo-sqlite"
import React, { useEffect, useState } from "react"
import { View } from "react-native"
import TileEventCard from "./TileEventCard"
import { updateTileEvent } from "@app/db/tileEvents"
import { showToast } from "@app/util/comms"
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates"
import { registerTranslation, de } from "react-native-paper-dates"
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar"
import { tileEvents } from "@app/db/schema"
import { and, eq } from "drizzle-orm"

type RoutineEventDisplayProps = {
    routineId: number
}
export const RoutineEventDisplay = ({ routineId }: RoutineEventDisplayProps) => {
    if (!routineId)
        return null

    registerTranslation("de", de)

    console.log(routineId)

    const [displayObj, setDisplayObj] = useState<{ event: TileEvent, timeVisible: boolean, dateVisible: boolean }>({ timeVisible: false, dateVisible: false, event: { data: "", tileId: 0, timestamp: new Date() } })
    const [tempDate, setTempDate] = useState<Date>()
    const [routine, setRoutine] = useState<RoutineWithTiles>()
    const [tiles, setTiles] = useState<TileOfRoutine[]>([])
    const [events, setEvents] = useState<TileEvent[]>([])
    const { data: routineData } = useLiveQuery(db().query.routines.findFirst({
        where(fields, operators) {
            return operators.eq(fields.id, routineId)
        }, with: {
            tiles: {
                with: {
                    events: true
                }
            }
        }
    }))
    useEffect(() => {
        if (!routineData) return
        setRoutine({ ...routineData, tiles: routineData.tiles.map(t => ({ ...t, tileId: t.id, routineId: routineId })) })
    }, [routineData])
    useEffect(() => {
        if (!routine) return
        setTiles(routine.tiles)
    }, [routine])
    useEffect(() => {
        if (!tiles) return
        setEvents(tiles.map(t => t.events).flat())
    }, [tiles])

    if (!routine) return null

    const editEvent = (e: TileEvent) => {
        setDisplayObj({ event: e, timeVisible: false, dateVisible: true })

    }
    const datePickerConfirm = ({ date }: { date: CalendarDate }) => {
        const newDate = new Date(displayObj.event.timestamp)
        newDate.setFullYear(date.getFullYear())
        newDate.setMonth(date.getMonth())
        newDate.setDate(date.getDate())

        setDisplayObj(p => ({ ...p, dateVisible: false, timeVisible: true }))
        setTempDate(newDate)
    }
    const timePickerConfirm = ({ hours, minutes }: { hours: number, minutes: number }) => {
        const newTimestamp = new Date(tempDate || new Date())
        newTimestamp.setHours(hours)
        newTimestamp.setMinutes(minutes)

        db().update(tileEvents)
            .set({ timestamp: newTimestamp })
            .where(
                and(
                    eq(tileEvents.tileId, displayObj.event.tileId),
                    eq(tileEvents.timestamp, displayObj.event.timestamp) // this is the old timestamp
                )
            ).returning().then(
                r => console.log("success", r),
                e => console.log("error", e)
            )

        // updateTileEvent(displayObj.event, { ...displayObj.event, timestamp: newTimestamp }, (err, res) => {
        //     console.log("err", err, "res", res)
        //     if (err) {
        //         showToast("Fehler beim Speichern des Events")
        //         return
        //     }
        //     showToast("Event gespeichert")
        // })

        setDisplayObj(p => ({ event: { ...p.event, timestamp: newTimestamp }, dateVisible: false, timeVisible: false }))
    }
    const cancelPicker = () => {
        setDisplayObj(p => ({ ...p, timeVisible: false, dateVisible: false }))
    }

    return (
        <>
            <TimePickerModal
                visible={displayObj.timeVisible}
                hours={displayObj.event.timestamp.getHours()}
                minutes={displayObj.event.timestamp.getMinutes()}
                onDismiss={cancelPicker}
                onConfirm={timePickerConfirm} />
            <DatePickerModal
                mode="single"
                locale="de"
                date={displayObj.event.timestamp}
                visible={displayObj.dateVisible}
                onDismiss={cancelPicker}
                onConfirm={datePickerConfirm} />

            <View style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 5, marginHorizontal: 15 }}>
                {/* {routine.tiles.map(t => ((t.events.length > 0) ?  */}
                {tiles.map(t => <TileEventCard editEvent={editEvent} key={t.id + t.name} tile={t} />)}
            </View>
        </>
    )
}