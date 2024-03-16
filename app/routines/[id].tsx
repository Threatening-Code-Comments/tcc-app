import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { IconButton } from '../components/IconButton'
import { TileComponent } from '../components/Tiles'
import TitleDisplay from '../components/TitleDisplay'
import { InsertTileOfRoutine, RoutineWithTiles, TileOfRoutine } from '../constants/DbTypes'
import { globalStyles } from '../constants/global'
import { getRoutinesWithTiles, insertTileIntoRoutine } from '../db/routineTiles'
import { useModal } from '../components/modal/Modal'
import { ResultSet } from 'expo-sqlite'

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

  const addTile = (name: string) => {
    const tile: InsertTileOfRoutine = {name: name, mode: 0, rootRoutineId: routineId, routineId: routineId, posX: 2, posY: 2, spanX: 2, spanY: 2};
    //generateRandomTile(routineId)

    insertTileIntoRoutine([tile], (err, res) => {
      if (err) {
        console.error("Error inserting tile: ", err)
      } else {
        const insertId = (res[0] as ResultSet).insertId as number
        const insertedTile: TileOfRoutine = { ...tile, id: insertId, tileId: insertId, counter: 0 }
        setTiles([...tiles, insertedTile])
        setVisible(false)
      }
    })
  }

  const { setVisible, component: AddTileModal, inputStates } = useModal<{
    "Tile Name": "string",
    "Add": "button"
  }>({
    title: "Add Tile",
    inputTypes: {
      "Tile Name": {
        type: "string"
      },
      "Add": {
        type: "button",
        onClick: () => {
          addTile(inputStates["Tile Name"])
        },
        icon: 'plus'
      }
    }
  })

  const tileCols = 3
  const routineName = (routine) ? routine.name : "Routine"

  return (
    <>
      <TitleDisplay text={routineName} />

      <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', paddingRight: 20}]}>
        {/* <IconButton iconName='refresh' text='Refresh' onPress={updateRoutine} type='secondary' /> */}
        <IconButton iconName='plus' text='Add' onPress={() => setVisible(true)} />
      </View>

      {AddTileModal}

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