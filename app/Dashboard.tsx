import React, { useEffect, useState } from "react"
import { FlatList, View, Text } from "react-native"
import { GenericTile } from "./components/tiles/GenericTile"
import { ElementTypeNames, DashboardEntry, DashboardSetting, ElementType, Page, RoutineOnPage, Tile } from "./constants/DbTypes"
import { getDashboardEntries, removeElementFromDashboard } from "./db/dashboard"
import { getPagesFromIds } from "./db/pages"
import { getRoutinesWithTiles } from "./db/routineTiles"
import { getEventsForTiles } from "./db/tileEvents"
import { getTilesFromIds } from "./db/tiles"
import { useLiveQuery } from "drizzle-orm/expo-sqlite"
import { db } from "./db/database"

export type DashboardList = { list: DashboardEntry[], setList: (list: DashboardEntry[]) => void }

type DashboardProps = {
    isEditMode?: boolean,
    dashboardList: DashboardList
}
export default function Dashboard({ isEditMode = false, dashboardList }: DashboardProps) {

    const [entries, setEntries] = useState<DashboardEntry[]>([])
    const [settings, setSettings] = useState<DashboardSetting[]>([])

    const { data: dashboardEntries } = useLiveQuery(db().query.dashboard.findMany({ with: { element: true } }))
    // console.log("list: : " , dashboardList)

    useEffect(() => console.log("entries: ", dashboardEntries), [dashboardEntries])

    const tileEntries = entries.filter((entry) => entry.elementType == "Tile")
    const routineEntries = entries.filter((entry) => entry.elementType == "Routine")
    const pageEntries = entries.filter((entry) => entry.elementType == "Page")

    const [elements, setElements] = useState<ElementType[]>([])
    useEffect(() => { }, [dashboardList])

    useEffect(() => {
        getDashboardEntries((_err, res) => {
            if (res[0] != undefined && res != entries)
                setEntries(res)
        })
    }, [])

    useEffect(() => {
        setElements([]) //reset elements
        getTilesFromIds(
            tileEntries.map((tile) => tile.elementId),
            (err, res) => {
                getEventsForTiles(
                    res.map((tile) => tile.id),
                    (err, events) => {
                        const tiles = res.map((tile) => {
                            const eventsOfTile = events.filter((event) => event.tileId == tile.id)
                            tile.counter = (eventsOfTile) ? eventsOfTile.length : 0
                            return tile as Tile
                        })

                        setElements(old => [...old, ...tiles])
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

                setElements(old => [...old, ...routines])
            }
        )

        getPagesFromIds(
            pageEntries.map((page) => page.elementId),
            (err, res) => {
                setElements(old => [...old, ...res])
            }
        )
    }, [entries])


    const numColumns = 4;
    return (<>
        <View style={{ margin: 10 }}>
            <View style={{ height: 15, borderColor: 'gray', borderTopWidth: 2, margin: 10, paddingTop: 5 }}>
                <Text style={{ color: 'white', fontSize: 20, height: 30, textAlign: 'center', fontWeight: 'bold' }}>Dashboard</Text>
            </View>
            <FlatList
                style={{ marginTop: 10 }}
                data={elements}
                numColumns={numColumns}
                renderItem={({ item }) =>
                    <GenericTile
                        key={"dashboard-" + item.id + "" + item.name}
                        element={item}
                        doAfterEdit={(() => { })}
                        isEditMode={isEditMode}
                        numColumns={numColumns}
                        onPressDelete={() => { removeElementFromDashboard(item, () => { setElements(old => old.filter((elem) => elem != item)) }) }}
                        isOnDashboard
                        dashboardList={dashboardList}
                    />

                }
            />
        </View>
    </>)
}