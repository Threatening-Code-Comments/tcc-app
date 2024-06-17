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

const PageDisplayPage = () => {
    const [page, setPage] = useState<Page>()
    const [routines, setRoutines] = useState<Array<RoutineOnPage>>([])
    const [isEditMode, setIsEditMode] = useState(false)
    useEffect(() => {
        updateRoutines()
    }, [])

    const id = Number(useLocalSearchParams()['id'])

    if (!page) {
        getPageById(id, (err, res) =>
            setPage(res[0])
        )
    }

    const addRoutine = (name: string) => {
        const routine: InsertRoutineOnPage = { name: name, rootPageId: page.id, pageId: page.id, color: getRandomColor() } //generateRandomRoutine(id)

        insertRoutinesOnPage([routine], (err, res) => {
            const routineInserted: RoutineOnPage = { ...routine, id: (res[0] as SQLiteRunResult).lastInsertRowId, routineId: (res[0] as SQLiteRunResult).lastInsertRowId, tiles: [] }

            setRoutines([...routines, routineInserted])
        })
    }

    const updateRoutines = () => {
        const routinesOfPage: RoutineOnPage[] = []
        const routinesWithTiles: RoutineWithTiles[] = []
        getRoutinesForPage(
            id,
            (error, res) => {
                (error) ? console.error("error getting routines") : ""

                routinesOfPage.push(...res)

                getRoutinesWithTiles(routinesOfPage.map(routine => routine.id),
                    (err, res) => {
                        routinesWithTiles.push(...res)

                        //iterate over routinesOfPage and insert tiles of corresponding routineWithTiles into the routineOnPage
                        routinesOfPage.map(routine => {
                            const tiles = routinesWithTiles.find(r => r.id === routine.id)?.tiles
                            routine.tiles = (tiles) ? tiles : []
                        })
                        // console.log("res with tiles: ", res, " | routines of page: ", routinesOfPage)
                        setRoutines(routinesOfPage)
                    })
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
        "Add": "submit"
    }>({
        title: "Add Routine",
        inputTypes: {
            "Routine Name": {
                type: "string"
            },
            "Add": {
                type: "submit",
                onClick: (data) => {
                    setVisible(false)
                    addRoutine(data['Routine Name'])
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