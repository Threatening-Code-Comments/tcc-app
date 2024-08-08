import { useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { IconButton } from '../components/IconButton'
import TitleDisplay from '../components/TitleDisplay'
import { useModal } from '../components/modal/Modal'
import { GenericTile } from '../components/tiles/GenericTile'
import { InsertRoutineOnPage, Page, RoutineOnPage, RoutineWithTiles } from '../constants/DbTypes'
import { globalStyles } from '../constants/global'
import { getRoutinesForPage, insertRoutinesOnPage } from '../db/pageRoutines'
import { getPageById } from '../db/pages'
import { getRoutinesWithTiles } from '../db/routineTiles'
import { deleteRoutine } from '../db/routines'
import { SQLiteRunResult } from 'expo-sqlite'
import { getRandomColor } from '@app/components/Colors'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { db } from '@app/db/database'
import * as schema from '@app/db/schema'
import { eq } from 'drizzle-orm'

const PageDisplayPage = () => {
    const [page, setPage] = useState<Page>()
    const [routines, setRoutines] = useState<Array<RoutineOnPage>>([])
    const [isEditMode, setIsEditMode] = useState(false)
    // useEffect(() => {
    //     updateRoutines()
    // }, [])

    const id = Number(useLocalSearchParams()['id'])

    const { data: routineData } = useLiveQuery(
        db().query.routines.findMany({
            where(fields, operators) {
                return operators.eq(fields.rootPageId, id)
            }, with: {
                tiles: {
                    with: {
                        events: true
                    }
                }
            },
            orderBy: schema.routines.id
        })
    )
    useEffect(() => {
        setRoutines(routineData.map(r => ({ ...r, pageId: id, routineId: r.id, tiles: r.tiles.map(t => ({ ...t, tileId: t.id, routineId: r.id })) })))
    }, [routineData])
    // useEffect(() => {
    //     console.log("2: ", routines.map(r => ({ name: r.name, tiles: r.tiles.length, id: r.id })))
    // }, [routines])

    if (!page) {
        getPageById(id, (err, res) =>
            setPage(res[0])
        )
    }

    const addRoutine = (name: string, color: string) => {
        const routine: InsertRoutineOnPage = { name: name, rootPageId: page.id, pageId: page.id, color: color } //generateRandomRoutine(id)
        console.log("color: ", color)
        insertRoutinesOnPage([routine], (err, res) => {
            const routineInserted: RoutineOnPage = { ...routine, id: (res[0] as SQLiteRunResult).lastInsertRowId, routineId: (res[0] as SQLiteRunResult).lastInsertRowId, tiles: [] }

            setRoutines([...routines, routineInserted])
        })
    }

    const removeRoutine = (routine: RoutineOnPage) => {
        deleteRoutine(routine, (err, res) => {
            setRoutines(routines.filter(r => r.id != routine.id))
        })
    }
    const updateRoutine = (routine: RoutineOnPage) => {
        setRoutines(routines.map(r => (r.id === routine.id) ? routine : r))
    }

    const { setVisible, component: ModalComponent } = useModal<{
        "Routine Name": "string"
        "Color": "slider-color"
        "Add": "submit"
    }>({
        title: "Add Routine",
        inputTypes: {
            "Routine Name": {
                type: "string"
            },
            "Color": {
                type: "slider-color",
                value: getRandomColor()
            },
            "Add": {
                type: "submit",
                onClick: (data) => {
                    setVisible(false)
                    addRoutine(data['Routine Name'], data.Color)
                },
                icon: 'plus'
            }
        }
    })

    const routineCols = 3

    return (<>
        <TitleDisplay
            text={(page) ? page.name : ""}
            secondaryText={`${routines.length} Routines`} />

        <View style={styles.buttonContainerContainer}>
            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end' }]}>
                <IconButton iconName='plus' text='Add' onPress={() => { setVisible(true) }} />
                <IconButton iconName='edit' text='Edit' onPress={() => setIsEditMode(!isEditMode)} type={(isEditMode) ? 'secondary' : 'primary'} />
            </View>

            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'space-around' }]}>
            </View>
        </View>

        {ModalComponent}

        <View style={{ height: 600, padding: 10 }}>
            <FlatList
                data={routines}
                extraData={routineData}
                numColumns={routineCols}
                renderItem={({ item }) =>
                    <GenericTile
                        numColumns={routineCols}
                        element={item}
                        isEditMode={isEditMode}
                        doAfterEdit={(routine) => updateRoutine(routine)}
                        onPressDelete={() => removeRoutine(item)} />
                }

            />
        </View>
    </>
    )
}

const styles = StyleSheet.create({
    buttonContainerContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 5,
        paddingRight: 20
    }
})


export default PageDisplayPage