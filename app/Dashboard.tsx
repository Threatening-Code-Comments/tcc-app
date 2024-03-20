import { useEffect, useState } from "react"
import { getPages, getPagesFromIds } from "./db/pages"
import { getDashboardEntries } from "./db/dashboard"
import { DashboardEntry, DashboardSetting, Page, Routine, Tile } from "./constants/DbTypes"
import React from "react"
import { FlatList, Text } from "react-native"
import { globalStyles } from "./constants/global"
import { getTilesFromIds } from "./db/Tiles"
import { getRoutinesFromIds } from "./db/routines"
import { pagesStatements } from "./constants/dbStatements"

export default function Dashboard() {

    const [entries, setEntries] = useState<DashboardEntry[]>([])
    const [settings, setSettings] = useState<DashboardSetting[]>([])

    const tileEntries = entries.filter((entry) => entry.elementType == "Tile")
    const routineEntries = entries.filter((entry) => entry.elementType == "Routine")
    const pageEntries = entries.filter((entry) => entry.elementType == "Page")

    const [tilesToDisplay, setTiles] = useState<Tile[]>([])
    const [routinesToDisplay, setRoutines] = useState<Routine[]>([])
    const [pagesToDisplay, setPages] = useState<Page[]>([])

    useEffect(() => {
        getDashboardEntries((_err, res) => {
            console.log("nnghghh ", _err, res)
            if (res[0] != undefined)
                setEntries(res)
        })
    }, [])

    useEffect(() => {
        getTilesFromIds(
            tileEntries.map((tile) => tile.elementId),
            (err, res) => setTiles(res)
        )
        getRoutinesFromIds(
            routineEntries.map((routine) => routine.elementId),
            (err, res) => setRoutines(res)
        )
        getPagesFromIds(
            pageEntries.map((page)=>page.elementId),
            (err, res) => setPages(res)
        )
    }, [entries])

    // console.log("Dashboard entries: ", entries)
    // console.log("E tiles: ", tilesToDisplay, " routines: ", routinesToDisplay, " pages: ", pagesToDisplay)
    console.log(":(")
    // console.log("tiles: ", tileEntries, " routines: ", routineEntries, " pages: ", pageEntries)
    // console.log(entries)


    return (<>
        <FlatList
            data={entries}
            renderItem={({ item }) => <Text style={globalStyles.text}>{item.elementId} | {item.elementType}</Text>}
        />
    </>)
}