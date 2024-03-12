import React, { useState } from 'react'
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Page, RoutineOnPage, Tile } from '../constants/DbTypes'
import { InsertCallback } from '../db/database'
import { insertTileEvent } from '../db/tileEvents'
import JLink from './JLink'
import { IconButton } from './IconButton'
import { Link } from 'expo-router'
import { useModal } from './modal/Modal'

type TileProps = {
    numColumns?: number
}
const getFlex = (numCols: number | undefined) => {
    return 1 / ((numCols) ? numCols : 2)
}

type TileComponentProps = {
    tile: Tile,
} & TileProps
export const TileComponent = ({ tile, numColumns }: TileComponentProps) => {
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
        <Pressable style={[styles.card, { flex: getFlex(numColumns) }]} onPress={addToCounter}>
            <Text style={styles.name}>{tile.name}</Text>
            <Text style={styles.info}>{counter}</Text>
        </Pressable>
    )
}



type RoutineTileComponentProps = {
    routine: RoutineOnPage
} & TileProps
export const RoutineTileComponent = ({ routine, numColumns }: RoutineTileComponentProps) => {
    const length = (routine.tiles) ? routine.tiles.length : 0

    return (
        <JLink style={[styles.card, { flex: getFlex(numColumns) }]} link={`/routines/${routine.id}`} >
            <Text style={styles.name}>{routine.name}</Text>
            <Text style={styles.info}>Has {length} Tiles</Text>
        </JLink>
    )
}



type PageTileComponentProps = {
    page: Page,
    isEditMode: boolean,
    onPressDelete: () => void,
    doAfterEdit: (page: Page) => void
} & TileProps
export const PageTileComponent = ({ page, numColumns, isEditMode, onPressDelete, doAfterEdit }: PageTileComponentProps) => {

    const editPageModal = useModal({
        title: "Edit Page",
        inputTypes: {
            "Name": { type: "string", value: page.name },
            "Save": {
                type: "button",
                icon: 'save',
                onClick: () => {
                    // @ts-ignore
                    page.name = editPageModal.inputStates["Name"]
                    doAfterEdit(page)
                    editPageModal.setVisible(false)
                }
            }
        }
    })

    return (
        <View style={{ display: 'flex', flexDirection: 'column', flex: getFlex(numColumns) }}>
            {editPageModal.component}
            <DeleteButton isEditMode={isEditMode} onPress={onPressDelete} />
            <LinkOrPressable style={[styles.card, { zIndex: 1 }]} link={`/pages/${page.id}`} isLink={!isEditMode} onPress={() => editPageModal.setVisible(true)}>
                <Text style={styles.name}>{page.name}</Text>
            </LinkOrPressable>

            {/* <JLink style={[styles.card, { zIndex: 1 }]} link={`/pages/${page.id}`} >
                <Text style={styles.name}>{page.name}</Text>
            </JLink> */}
        </View>
    )
}

type LinkOrPressableProps = {
    isLink: boolean,
    link: string,
    onPress: () => void,
    replace?: boolean,
    style?: StyleProp<ViewStyle>,
    children: React.ReactNode,
}
const LinkOrPressable = ({ isLink, link, onPress, replace, style, children }: LinkOrPressableProps) => {
    return (
        (isLink) ?
            <JLink link={link} replace={replace} style={style}>{children}</JLink> :
            <Pressable onPress={onPress} style={style}>{children}</Pressable>
    )
}


type DeleteButtonProps = {
    isEditMode: boolean,
    onPress: () => void
}
const DeleteButton = ({ isEditMode, onPress }: DeleteButtonProps) => {
    if (!isEditMode) return <></>

    return (
        <View style={{ zIndex: 2, marginBottom: -50, width: '45%', height: 50, alignSelf: 'flex-end', }}>
            <IconButton
                iconName='times'
                type='error'
                onPress={onPress} />
        </View >)
}


const styles = StyleSheet.create({
    card: {
        aspectRatio: 1,
        zIndex: 0,
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