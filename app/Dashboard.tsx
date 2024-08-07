import React, { useEffect, useState } from "react"
import { FlatList, View, Text } from "react-native"
import { GenericTile } from "./components/tiles/GenericTile"
import { ElementTypeNames, DashboardEntry, DashboardSetting, ElementType, Page, RoutineOnPage, Tile, RoutineWithTiles } from "./constants/DbTypes"
import { getDashboardEntries, removeElementFromDashboard } from "./db/dashboard"
import { getPageByIdStmt, getPagesFromIds } from "./db/pages"
import { getRoutinesWithTiles } from "./db/routineTiles"
import { getEventsForTiles } from "./db/tileEvents"
import { getTilesFromIds, getTilesFromIdsStmt } from "./db/tiles"
import { useLiveQuery } from "drizzle-orm/expo-sqlite"
import { db } from "./db/database"
import * as schema from "@db/schema"
import { inArray } from "drizzle-orm"
import { getRoutinesFromIdsStmt } from "./db/routines"

export type DashboardList = { list: DashboardEntry[], setList: (list: DashboardEntry[]) => void }

type DashboardProps = {
    isEditMode?: boolean,
    dashboardList: DashboardList
}
export default function Dashboard({ isEditMode = false, dashboardList }: DashboardProps) {
    const getIdsForType = (type: ElementTypeNames) => {
        const entries = dashboardList.list.filter((entry) => entry.elementType == type).map(e => e.elementId)
        return (entries.length == 0) ? [-1] : entries
    }

    const [elements, setElements] = useState<ElementType[]>([])

    const [tiles, setTiles] = useState<Tile[]>([])
    const [routines, setRoutines] = useState<RoutineWithTiles[]>([])
    const [pages, setPages] = useState<Page[]>([])

    const { data: tileData } = useLiveQuery(getTilesFromIdsStmt(getIdsForType(ElementTypeNames.Tile)))
    const { data: routinesData } = useLiveQuery(getRoutinesFromIdsStmt(getIdsForType(ElementTypeNames.Routine)))
    const { data: pageData } = useLiveQuery(getPageByIdStmt(getIdsForType(ElementTypeNames.Page)))

    useEffect(() => {
        setTiles(tileData)
        setRoutines(routinesData.map(r => ({ ...r, tiles: r.tiles.map(t => ({ ...t, tileId: t.id, routineId: r.id })) })))
        setPages(pageData)
    }, [tileData, routinesData, pageData, dashboardList.list])

    useEffect(() => {
        const getElement = ({ elementId, elementType }: DashboardEntry) => {
            switch (elementType) {
                case ElementTypeNames.Tile:
                    return tiles.find((tile) => tile.id == elementId)
                case ElementTypeNames.Routine:
                    return routines.find((routine) => routine.id == elementId)
                case ElementTypeNames.Page:
                    return pages.find((page) => page.id == elementId)
                default: throw new Error("Element type is not correct: " + elementType)
            }
        }
        setElements(dashboardList.list.map(entry => getElement(entry)).filter(e => !!e))
    }, [tiles, routines, pages])


    const numColumns = 4;
    return (<>
        <View style={{width: 100, }} >
            {/* <View style={{ height: 15, borderColor: 'gray', borderTopWidth: 2, margin: 10, paddingTop: 5 }}>
                <Text style={{ color: 'white', fontSize: 20, height: 30, textAlign: 'center', fontWeight: 'bold' }}>Dashboard</Text>
            </View> */}
            <FlatList
                style={{ marginTop: 0 }}
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