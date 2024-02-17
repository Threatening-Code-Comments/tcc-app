import React, { useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Page, RoutineOnPage, Tile } from '../constants/DbTypes'
import { insertTileEvent } from '../db/tileEvents'
import JLink from './JLink'
import { InsertCallback } from '../db/database'


type TileComponentProps = {
    tile: Tile
}
export const TileComponent = ({ tile }: TileComponentProps) => {
    const [counter, setCounter] = useState(tile.counter)

    const addToCounter = () => {
        const callback: InsertCallback = (err, res) => {
            if (err) {
                console.error("Error inserting tile event: ", err)
            } else {
                console.info("Inserted tile event: ", res)

                tile.counter += 1
                setCounter(tile.counter)
            }
        }

        insertTileEvent(tile.id, new Date(), "", callback)
    }

    return (
        <Pressable style={{ ...styles.card, flex: 1 / 2 }} onPress={addToCounter}>
            <Text style={styles.name}>{tile.name}</Text>
            <Text style={styles.info}>{counter}</Text>
        </Pressable>
    )
}



type RoutineTileComponentProps = {
    routine: RoutineOnPage
}
export const RoutineTileComponent = ({ routine }: RoutineTileComponentProps) => {
    const length = (routine.tiles) ? routine.tiles.length : 0

    return (
        <JLink style={{ ...styles.card, flex: 1 / 4 }} link={`/routines/${routine.id}`} >
            <Text style={styles.name}>{routine.name}</Text>
            <Text style={styles.info}>Has {length} Tiles</Text>
        </JLink>
    )
}



type PageTileComponentProps = {
    page: Page
}
export const PageTileComponent = ({page}: PageTileComponentProps) => {
    return (
        <JLink style={{ ...styles.card, flex: 1 / 2 }} link={`/pages/${page.id}`} >
            <Text style={styles.name}>{page.name}</Text>
            <Text style={styles.info}>Has {page.id} Tiles</Text>
        </JLink>
    )
}



const styles = StyleSheet.create({
    card: {
        aspectRatio: 1,
        minHeight: 100,
        borderRadius: 15,
        backgroundColor: '#333',
        color: 'white',
        justifyContent: 'center',
    },
    centerContainer: {
        height: '100%',
        width: '100%',
        display: 'flex',
        gap: 5,
        padding: 5,
        alignSelf: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    name: {
        fontSize: 20,
        marginHorizontal: 10,
        fontWeight: '500',
        color: 'white',
        textAlign: 'center'
    },
    info: {
        fontSize: 10,
        fontWeight: '200',
        color: 'white',
        textAlign: 'center'
    }
})