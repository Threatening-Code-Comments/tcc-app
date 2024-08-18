import { getRandomColor } from '@app/components/Colors'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { IconButton } from '../components/IconButton'
import { useModal } from '../components/modal/Modal'
import { GenericTile } from '../components/tiles/GenericTile'
import TitleDisplay from '../components/TitleDisplay'
import { InsertTileOfRoutine, RoutineWithTiles, TileOfRoutine } from '../constants/DbTypes'
import { globalStyles } from '../constants/global'
import { getRoutinesWithTiles, insertTilesIntoRoutine } from '../db/routineTiles'
import { db } from '@app/db/database'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import JLink from '@app/components/JLink'
import { Text } from 'react-native-paper'

const RoutineDisplayPage = () => {
  const routineId = +useLocalSearchParams()['id']
  const router = useRouter()

  const [routine, setRoutine] = useState<RoutineWithTiles>()
  const [tiles, setTiles] = useState<Array<TileOfRoutine>>()
  const [isEditMode, setIsEditMode] = useState(false)



  const { data: routineData } = useLiveQuery(db().query.routines.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, routineId)
    }, with: {
      tiles: {
        with: {
          events: true
        }
      }
    }
  }))
  useEffect(() => {
    if (!routineData) return
    const tiles = routineData.tiles.map(t => ({ ...t, tileId: t.id, routineId: routineId }))
    setRoutine({ ...routineData, tiles: tiles })
    setTiles(tiles)
  }, [routineData])

  const addTile = (name: string) => {
    const tile: InsertTileOfRoutine = { name: name, mode: 0, rootRoutineId: routineId, routineId: routineId, color: getRandomColor() };

    insertTilesIntoRoutine([tile], (err, res) => {
      if (err) {
        console.error("Error inserting tile: ", err)
      } else {
        const insertId = res[0].lastInsertRowId
        const insertedTile: TileOfRoutine = { ...tile, id: insertId, tileId: insertId, events: [] }
        setTiles([...tiles, insertedTile])
        setVisible(false)
      }
    })
  }

  const { setVisible, component: AddTileModal } = useModal<{
    "Tile Name": "string",
    "Color": "slider-color",
    "Add": "submit"
  }>({
    title: "Add Tile",
    inputTypes: {
      "Tile Name": {
        type: "string"
      },
      "Color": {
        type: "slider-color",
        value: getRandomColor()
      },
      "Add": {
        type: "submit",
        onClick: (data) => {
          addTile(data['Tile Name'])
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

      <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', paddingRight: 20 }]}>
        {/* <IconButton iconName='refresh' text='Refresh' onPress={updateRoutine} type='secondary' /> */}
        <IconButton iconName='add' text='Add' onPress={() => setVisible(true)} />
        <IconButton iconName='edit' text='Edit' onPress={() => setIsEditMode(!isEditMode)} type={isEditMode ? 'secondary' : 'primary'} />
        <IconButton iconName='list' text='Events' onPress={() => router.push('/events/r' + routineId)} />
      </View>

      {AddTileModal}

      {/*display tiles*/}
      <View style={{ height: 600, padding: 10 }}>
        <FlatList
          style={{ height: 500 }}
          data={tiles}
          numColumns={tileCols}
          renderItem={(test) =>
            <GenericTile
              numColumns={tileCols}
              element={test.item}
              isEditMode={isEditMode}
              doAfterEdit={() => { }}
              onPressDelete={() => { }}
            />
          }
        />
      </View>
    </>
  )
}

export default RoutineDisplayPage