import React, { useEffect, useState } from "react"
import { Text, View } from "react-native"
import { DashboardEntry, ElementTypeNames, Page, RoutineWithTiles, Tile } from "./constants/DbTypes"
import { getPagesFromIds } from "./db/pages"
import { getRoutinesWithTiles } from "./db/routineTiles"
import { getTilesFromIds } from "./db/tiles"

type TestProps = {
    elementList: DashboardEntry[]
}
export default function TestComponent({ elementList }: TestProps) {
    const getIdsForType = (type: ElementTypeNames) => {
        const entries = elementList.filter((entry) => entry.elementType == type).map(e => e.elementId)
        return (entries.length == 0) ? [-1] : entries
    }

    const [tiles, setTiles] = useState<Tile[]>([])
    const [routines, setRoutines] = useState<RoutineWithTiles[]>([])
    const [pages, setPages] = useState<Page[]>([])
    useEffect(() => {
        getTilesFromIds(
            getIdsForType(ElementTypeNames.Tile),
            (err, res) => (!err) ? setTiles(res) : console.error(err)
        )

        getRoutinesWithTiles(
            getIdsForType(ElementTypeNames.Routine),
            (err, res) => (!err) ? setRoutines(res) : console.error(err)
        )

        getPagesFromIds(
            getIdsForType(ElementTypeNames.Page),
            (err, res) => (!err) ? setPages(res) : console.error(err)
        )
    }, [elementList])


    return (
        <View>
            <Text>Tiles: {tiles.map(t => t.name).join(', ')}</Text>
            <Text>Routines: {routines.map(r => r.name).join(', ')}</Text>
            <Text>Pages: {pages.map(p => p.name).join(', ')}</Text>
        </View>
    )
}