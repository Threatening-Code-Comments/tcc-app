import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { IconButton } from '../components/IconButton'
import { RoutineTileComponent } from '../components/Tiles'
import { InsertRoutineOnPage, Page, RoutineOnPage, RoutineWithTiles } from '../constants/DbTypes'
import { getRoutinesForPage, insertRoutineOnPage as insertRoutinesOnPage } from '../db/pageRoutines'
import { getPageById } from '../db/pages'
import { getRoutinesWithTiles } from '../db/routineTiles'

let addedRoutine = false
const PageDisplayPage = () => {
    const [page, setPage] = useState<Page>()
    const id = Number(useLocalSearchParams()['id'])
    const next = (id) ? id + 1 : 0
    const prev = (id) ? id - 1 : 0
    const router = useRouter()

    const [queried, setQueried] = useState(false)

    if (!page) {
        getPageById(id, (err, res) =>
            setPage(res[0])
        )
    }

    const addRoutine = () => {
        const routine = generateRandomRoutine(id)

        insertRoutinesOnPage([routine])
        setQueried(false)
        addedRoutine = true
        updateRoutines()
    }

    const [routines, setRoutines] = useState<Array<RoutineOnPage>>([])
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

    if (!queried) {
        updateRoutines()
        setQueried(true)
    }

    useEffect(() => {
        updateRoutines()
        addedRoutine = false
    }, [addedRoutine])

    return (<>
        <Text>Hello world</Text>
        <Text>Page ID: {(page) ? page.id : ""}</Text>
        <Text>Page name: {(page) ? page.name : ""}</Text>

        <View style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, }}>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                <IconButton iconName='plus' text='Add' onPress={addRoutine} />
                <IconButton iconName='refresh' text='Refresh' onPress={updateRoutines} />
            </View>

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                <IconButton iconName='arrow-left' text='Prev' onPress={() => router.replace(`/pages/${prev}`)} />
                <IconButton iconName='arrow-right' text='Next' onPress={() => router.replace(`/pages/${next}`)} />
            </View>
        </View>

        <View style={{ height: 600, padding: 10 }}>
            <FlatList
                data={routines}
                numColumns={4}
                contentContainerStyle={{ gap: 10 }}
                columnWrapperStyle={{ gap: 10 }}
                renderItem={({ item }) => <RoutineTileComponent routine={item} />}
            />
        </View>
    </>
    )
}



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