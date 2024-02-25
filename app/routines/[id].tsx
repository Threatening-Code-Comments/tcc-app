import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { IconButton } from '../components/IconButton'
import { TileComponent } from '../components/Tiles'
import { InsertTileOfRoutine, RoutineWithTiles, TileOfRoutine } from '../constants/DbTypes'
import { getRoutinesWithTiles, insertTileIntoRoutine } from '../db/routineTiles'
import TitleDisplay from '../components/TitleDisplay'
import { globalStyles } from '../constants/global'

const RoutineDisplayPage = () => {
  const routineId = +useLocalSearchParams()['id']
  const router = useRouter()

  const [routine, setRoutine] = useState<RoutineWithTiles>()
  const [tiles, setTiles] = useState<Array<TileOfRoutine>>()
  useEffect(() => {
    updateRoutine()
  }, [])

  const reloadScreen = () => {
    router.replace(`/routines/${routineId}`)
  }

  const updateRoutine = () => {
    getRoutinesWithTiles([routineId], (_err, res) => {
      setRoutine(res[0])
      const tilesOfRoutine = (res[0].tiles.length > 0) ? res[0].tiles : []
      setTiles(tilesOfRoutine)
    })
  }

  const addTile = () => {
    const tile = generateRandomTile(routineId)

    insertTileIntoRoutine([tile], (err, res) => {
      if (err) {
        console.error("Error inserting tile: ", err)
      } else {
        console.info("Inserted tile: ", res)
        reloadScreen()
      }
    })
  }

  const tileCols = 3
  const routineName = (routine) ? routine.name : "Routine"

  return (
    <>
      <TitleDisplay text={routineName} />

      <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', }]}>
        <IconButton iconName='refresh' text='Refresh' onPress={updateRoutine} type='secondary' />
        <IconButton iconName='plus' text='Add Tile' onPress={addTile} />
      </View>

      {/*display tiles*/}
      <View style={{ height: 600, padding: 20 }}>
        <FlatList
          style={{ height: 500 }}
          data={tiles}
          contentContainerStyle={{ gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
          numColumns={tileCols}
          renderItem={(test) =>
            <TileComponent
              numColumns={tileCols}
              tile={test.item} />}
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