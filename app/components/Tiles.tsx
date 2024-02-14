import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Page, Routine, RoutineOnPage, RoutineWithTiles, Tile } from '../constants/DbTypes'
import { flattenDiagnosticMessageText } from 'typescript'
import { Link } from 'expo-router'
import JLink from './JLink'


type TileComponentProps = {
    tile: Tile
}
const TileComponent = (props: TileComponentProps) => {
    return (
        <View style={styles.card}>
            <Text style={styles.name}>{props.tile.name}</Text>
            <Text style={styles.info}>{props.tile.mode}</Text>
        </View>
    )
}

export default TileComponent

type RoutineTileComponentProps = {
    routine: RoutineOnPage
}
export const RoutineTileComponent = (props: RoutineTileComponentProps) => {
    return (
        <JLink style={{...styles.card, flex: 1/4}} link={`/routines/${props.routine.id}`} >
            <Text style={styles.name}>{props.routine.name}</Text>
            <Text style={styles.info}>Has {props.routine.routineId} Tiles</Text>
        </JLink>
    )
}

type PageTileComponentProps = {
    page: Page
}
export const PageTileComponent = (props: PageTileComponentProps) => {
    return (
        <JLink style={{...styles.card, flex: 1/2}} link={`/pages/${props.page.id}`} >
            <Text style={styles.name}>{props.page.name.substring(0, 5)}</Text>
            <Text style={styles.info}>Has {props.page.id} Tiles</Text>
        </JLink>
    )
}


const styles = StyleSheet.create({
    card: {
        // flex: 1/2,
        aspectRatio: 1,
        minHeight: 100,
        borderRadius: 15,
        backgroundColor: '#333',
        // padding: 5,
        // gap: 5,
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