import { useEffect, useState } from "react"
import { getPages, getPagesFromIds } from "./db/pages"
import { getDashboardEntries } from "./db/dashboard"
import { DashboardEntry, DashboardSetting, ElementType, isRoutineOnPage, Page, Routine, RoutineOnPage, Tile } from "./constants/DbTypes"
import React from "react"
import { FlatList, Text, View } from "react-native"
import { globalStyles } from "./constants/global"
import { getTilesFromIds } from "./db/tiles"
import { getRoutinesFromIds } from "./db/routines"
import { pagesStatements } from "./constants/dbStatements"
import { GenericTile } from "./components/tiles/GenericTile"
import { getEventsForTiles } from "./db/tileEvents"
import { getRoutinesWithTiles } from "./db/routineTiles"

export default function Dashboard() {

    const [entries, setEntries] = useState<DashboardEntry[]>([])
    const [settings, setSettings] = useState<DashboardSetting[]>([])

    const tileEntries = entries.filter((entry) => entry.elementType == "Tile")
    const routineEntries = entries.filter((entry) => entry.elementType == "Routine")
    const pageEntries = entries.filter((entry) => entry.elementType == "Page")

    const [elements, setElements] = useState<ElementType[]>([])

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
            (err, res) => {
                getEventsForTiles(
                    res.map((tile) => tile.id),
                    (err, events) => {
                        const tiles = res.map((tile) => {
                            tile.counter = events.filter((event) => event.tileId == tile.id).length
                            return tile as Tile
                        })

                        setElements(old=> [...old, ...tiles])
                    }
                )
            }
        )

        getRoutinesWithTiles(
            routineEntries.map((routine) => routine.elementId),
            (err, res) => {
                const routines = res.map((routine) => {
                    return { ...routine, pageId: 0, routineId: routine.id, posX: 0, posY: 0, spanX: 0, spanY: 0 } as RoutineOnPage
                })

                setElements(old=> [...old, ...routines])
            }
        )

        getPagesFromIds(
            pageEntries.map((page) => page.elementId),
            (err, res) => {
                setElements(old=> [...old, ...res])
            }
        )
    }, [entries])


    const numColumns = 3;
    return (<>
        <View style={{ margin: 10 }}>
            <FlatList
                data={elements}
                numColumns={numColumns}
                renderItem={({ item }) =>
                    <GenericTile
                        key={item.id + "" + item.name}
                        element={item}
                        doAfterEdit={(() => { })}
                        isEditMode={false}
                        numColumns={numColumns}
                        onPressDelete={() => { }}
                        isOnDashboard
                    />

                }
            />
        </View>
    </>)
}