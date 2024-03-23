import React, { useEffect, useState } from "react"
import { FlatList, View } from "react-native"
import { GenericTile } from "./components/tiles/GenericTile"
import { DashboardEntry, DashboardSetting, ElementType, RoutineOnPage, Tile } from "./constants/DbTypes"
import { getDashboardEntries, removeElementFromDashboard } from "./db/dashboard"
import { getPagesFromIds } from "./db/pages"
import { getRoutinesWithTiles } from "./db/routineTiles"
import { getEventsForTiles } from "./db/tileEvents"
import { getTilesFromIds } from "./db/tiles"

type DashboardProps = {
    isEditMode?: boolean
}
export default function Dashboard({ isEditMode = false }: DashboardProps) {

    const [entries, setEntries] = useState<DashboardEntry[]>([])
    const [settings, setSettings] = useState<DashboardSetting[]>([])

    const tileEntries = entries.filter((entry) => entry.elementType == "Tile")
    const routineEntries = entries.filter((entry) => entry.elementType == "Routine")
    const pageEntries = entries.filter((entry) => entry.elementType == "Page")

    const [elements, setElements] = useState<ElementType[]>([])

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
                            tile.counter = events.filter((event) => event.tileId == tile.id).length
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
                        isEditMode={isEditMode}
                        numColumns={numColumns}
                        onPressDelete={() => { removeElementFromDashboard(item, () => { setElements(old => old.filter((elem) => elem != item)) }) }} 
                        isOnDashboard
                    />

                }
            />
        </View>
    </>)
}