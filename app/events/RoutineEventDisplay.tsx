import { RoutineWithTiles } from "@app/constants/DbTypes"
import { db } from "@app/db/database"
import { useLiveQuery } from "drizzle-orm/expo-sqlite"
import React, { useEffect, useState } from "react"
import { View } from "react-native"
import TileEventCard from "./TileEventCard"

type RoutineEventDisplayProps = {
    routineId: number
}
export const RoutineEventDisplay = ({ routineId }: RoutineEventDisplayProps) => {
    if (!routineId)
        return null

    console.log(routineId)

    const [routine, setRoutine] = useState<RoutineWithTiles>()
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

    if (!routine) return null

    return (
        <>
            <View style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 5 }}>
                {routine.tiles.map(t => (<TileEventCard key={t.id + t.name} tile={t} />))}
            </View>
        </>
    )
}