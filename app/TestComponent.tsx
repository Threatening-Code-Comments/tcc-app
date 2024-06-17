import { useLiveQuery } from "drizzle-orm/expo-sqlite"
import React, { useEffect } from "react"
import { db } from "./db/database"
import { Text, View } from "react-native"
import { DashboardEntry, ElementTypeNames } from "./constants/DbTypes"
import * as s from "./db/schema"
import { inArray } from "drizzle-orm"

type TestProps = {
    elementList: DashboardEntry[]
}
export default function TestComponent({ elementList }: TestProps) {
    const getIdsForType = (type: ElementTypeNames) => {
        const entries = elementList.filter((entry) => entry.elementType == type).map(e => e.elementId)
        return (entries.length == 0) ? [-1] : entries
    }

    const { data: tiles } = useLiveQuery(db().select().from(s.tiles).where(inArray(s.tiles.id, getIdsForType(ElementTypeNames.Tile))))
    const { data: routines } = useLiveQuery(db().select().from(s.routines).where(inArray(s.routines.id, getIdsForType(ElementTypeNames.Routine))))
    const { data: pages } = useLiveQuery(db().select().from(s.pages).where(inArray(s.pages.id, getIdsForType(ElementTypeNames.Page))))

    useEffect(() => {
        console.log("tiles: ", tiles.map(t => t.name))
        console.log("routines: ", routines.map(t => t.name))
        console.log("pages: ", pages.map(t => t.name))
    }, [tiles, pages, routines])

    return <>
        <View>
            <Text>Tiles: {tiles.map(t => t.name).join(', ')}</Text>
            <Text>Routines: {routines.map(r => r.name).join(', ')}</Text>
            <Text>Pages: {pages.map(p => p.name).join(', ')}</Text>
        </View>
    </>
}