import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { FlatList, ScrollView } from 'react-native-gesture-handler'
import { IconButton } from '../components/IconButton'
import { InsertTileOfRoutine, Routine, RoutineWithTiles, TileOfRoutine } from '../constants/DbTypes'
import { db } from '../db/database'
import { getRoutinesWithTiles, insertTileIntoRoutine } from '../db/routineTiles'
import TileComponent from '../components/Tiles'

const RoutineDisplayPage = () => {
  const routineId = +useLocalSearchParams()['id']
  const router = useRouter()

  const [routine, setRoutine] = useState<RoutineWithTiles>()
  const [tiles, setTiles] = useState<Array<TileOfRoutine>>()

  const updateRoutine = () => {
    // console.log("updating routines")

    getRoutinesWithTiles([routineId], (err, res) => {
      console.log("Routines: ", res[0])

      setRoutine(res[0])
      setTiles(res[0].tiles)
    })
  }

  const addTile = () => {
    console.log("adding tile")

    const tile = generateRandomTile(routineId)

    insertTileIntoRoutine([tile])
  }


  useEffect(() => {
    updateRoutine()
  }, [])

  return (
    <>
      <Text>RoutineDisplayPage</Text>

      <View style={{ display: 'flex', flexDirection: 'row', gap: 5 }}>
        <IconButton iconName='refresh' text='Refresh' onPress={updateRoutine} />
        <IconButton iconName='plus' text='Add Tile' onPress={addTile} />
        {/* <IconButton iconName='facebook' text='Query all' onPress={queryAll} /> */}
      </View>

      <Text>Tiles: {JSON.stringify(tiles, null, 3)}</Text>


      {/*display tiles*/}
      <FlatList
        style={{ height: 500 }}
        data={tiles}
        contentContainerStyle={{ gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        numColumns={4}
        renderItem={(test) => <TileComponent tile={test.item} />}
      />
    </>
  )
}

const getRandom = (max: number): number => {
  let random = Math.random() * (max + 1)
  if (random > max)
    random = max

  return Math.floor(random)
}

const generateRandomTile = (routineId: number): InsertTileOfRoutine => {
  const rn = getRandom(4000)
  return {
    name: `Tile ${rn}`,
    mode: getRandom(1),
    rootRoutineId: routineId,
    routineId: routineId,
    posX: getRandom(3),
    posY: getRandom(12),
    spanX: getRandom(4),
    spanY: getRandom(5)
  }
}

export default RoutineDisplayPage