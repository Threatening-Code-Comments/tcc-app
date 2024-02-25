import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { IconButton } from '../components/IconButton'
import { RoutineTileComponent } from '../components/Tiles'
import TitleDisplay from '../components/TitleDisplay'
import { InsertRoutineOnPage, Page, RoutineOnPage, RoutineWithTiles } from '../constants/DbTypes'
import { globalStyles } from '../constants/global'
import { getRoutinesForPage, insertRoutineOnPage as insertRoutinesOnPage } from '../db/pageRoutines'
import { getPageById } from '../db/pages'
import { getRoutinesWithTiles } from '../db/routineTiles'

const PageDisplayPage = () => {
    const [page, setPage] = useState<Page>()
    const [queried, setQueried] = useState(false)
    const [routines, setRoutines] = useState<Array<RoutineOnPage>>([])
    useEffect(() => {
        updateRoutines()
        setQueried(true)
    }, [])

    const id = Number(useLocalSearchParams()['id'])
    const next = (id) ? id + 1 : 0
    const prev = (id) ? id - 1 : 0
    const router = useRouter()

    if (!page) {
        getPageById(id, (err, res) =>
            setPage(res[0])
        )
    }

    const addRoutine = () => {
        const routine = generateRandomRoutine(id)

        insertRoutinesOnPage([routine])
        setQueried(false)
        updateRoutines()
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
                        setRoutines(routinesOfPage)
                    })
            })
    }

    const routineCols = 3

    return (<>
        <TitleDisplay
            text={(page) ? page.name : ""}
            secondaryText={`${routines.length} Routines`} />

        <View style={styles.buttonContainerContainer}>
            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end' }]}>
                <IconButton iconName='plus' text='Add' onPress={addRoutine} />
                <IconButton iconName='refresh' text='Refresh' onPress={updateRoutines} type='secondary' />
            </View>

            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'space-around' }]}>
                <IconButton iconName='arrow-left' text='Prev' onPress={() => router.replace(`/pages/${prev}`)} />
                <IconButton iconName='arrow-right' text='Next' onPress={() => router.replace(`/pages/${next}`)} />
            </View>
        </View>

        <View style={{ height: 600, padding: 10 }}>
            <FlatList
                data={routines}
                numColumns={routineCols}
                contentContainerStyle={{ gap: 10 }}
                columnWrapperStyle={{ gap: 10 }}
                renderItem={({ item }) => <RoutineTileComponent numColumns={routineCols} routine={item} />}
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
    }
})

const getRandom = (max: number): number => {
    let random = Math.random() * (max + 1)
    if (random > max)
        random = max

    return Math.floor(random)
}

const generateRandomRoutine = (pageId: number): InsertRoutineOnPage => {
    const rn = getRandom(4000)
    return {
        name: `Rou ${rn}`,
        pageId: pageId,
        posX: getRandom(3),
        posY: getRandom(12),
        spanX: getRandom(4),
        spanY: getRandom(5)
    }
}


export default PageDisplayPage