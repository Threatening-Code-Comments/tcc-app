import React, {useState} from "react";
import {ScrollView, View} from "react-native";
import {Card, Text, TextInput} from "react-native-paper";
import {runOnJS, useAnimatedReaction} from "react-native-reanimated";
import {IconButton} from "@components/IconButton";
import {getContrastColor} from "@components/Colors";
import {Routine, Tile} from "@components/homescreen/types";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

const TILE_SIZE = 70
const UNCATEGORIZED = 0

/**
 * The tile library, browsable/searchable. One level of grouping (by routine) —
 * with hundreds of tiles a flat list isn't enough, but a second nested level
 * (routines inside pages, like the production app) would add more complexity than
 * it's worth here. Search ignores the grouping and flattens across everything, the
 * same way "open + search" already substitutes for page-level quick access.
 * Drag-out onto the homescreen isn't built yet — this is browse + search only for now.
 */
export function AppDrawer() {
    const {tiles, routines} = useHomescreenData()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")

    //bridges tiles.value/routines.value changes (e.g. a new tile created elsewhere) into
    //a re-render, same pattern used throughout the homescreen for SharedValue-backed reads.
    const [, setRefreshTick] = useState(false)
    useAnimatedReaction(
        () => tiles.value.length + routines.value.length,
        (current, previous) => {
            if (current !== previous) runOnJS(setRefreshTick)(t => !t)
        }, [tiles, routines]
    )

    const toggleModal = () => setIsOpen(v => !v)

    const allTiles = tiles.value
    const allRoutines = routines.value
    const matchesQuery = (t: Tile) => t.name.toLowerCase().includes(query.trim().toLowerCase())

    const isSearching = query.trim().length > 0
    const searchResults = isSearching ? allTiles.filter(matchesQuery) : []

    const groups: { routine?: Routine, tiles: Tile[] }[] = [
        ...allRoutines.map(routine => ({
            routine,
            tiles: allTiles.filter(t => t.rootRoutineId === routine.id)
        })),
        {routine: undefined, tiles: allTiles.filter(t => t.rootRoutineId === UNCATEGORIZED)},
    ].filter(g => g.tiles.length > 0)

    return (
        <Card
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: "100%",
                height: isOpen ? 500 : 100,
                zIndex: 2000,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
            }}
        >
            <View style={{alignItems: "center", justifyContent: "center", paddingTop: 8}}>
                <IconButton iconName={isOpen ? "arrowDown" : "arrowUp"} type={"transparent"}
                            onPress={toggleModal}
                            text={"Apps"}/>
            </View>

            {isOpen && (
                <View style={{flex: 1, paddingHorizontal: 12}}>
                    <Text style={{opacity: 0.5, fontSize: 10}}>
                        DEBUG ctx: {tiles.value.length} tiles, {routines.value.length} routines
                    </Text>
                    <TextInput
                        mode="outlined"
                        dense
                        placeholder="Suchen..."
                        value={query}
                        onChangeText={setQuery}
                        style={{marginBottom: 8}}
                    />
                    <ScrollView>
                        {isSearching
                            ? <TileGrid tiles={searchResults} emptyLabel="Keine Tiles gefunden."/>
                            : groups.map(group => (
                                <View key={group.routine?.id ?? "uncategorized"} style={{marginBottom: 16}}>
                                    <Text variant="labelLarge" style={{opacity: 0.7, marginBottom: 6}}>
                                        {group.routine?.name ?? "Ohne Routine"}
                                    </Text>
                                    <TileGrid tiles={group.tiles}/>
                                </View>
                            ))}
                        {!isSearching && groups.length === 0 && (
                            <Text style={{opacity: 0.6}}>Keine Tiles vorhanden.</Text>
                        )}
                    </ScrollView>
                </View>
            )}
        </Card>
    )
}

const TileGrid = ({tiles, emptyLabel}: { tiles: Tile[], emptyLabel?: string }) => (
    <View style={{flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 12}}>
        {tiles.map(tile => <AppDrawerTile key={tile.id} tile={tile}/>)}
        {tiles.length === 0 && !!emptyLabel && (
            <Text style={{opacity: 0.6}}>{emptyLabel}</Text>
        )}
    </View>
)

const AppDrawerTile = ({tile}: { tile: Tile }) => {
    const contrastColor = getContrastColor(tile.color)

    return (
        <View style={{
            width: TILE_SIZE, height: TILE_SIZE,
            backgroundColor: tile.color,
            borderRadius: 10,
            alignItems: 'center', justifyContent: 'center',
            padding: 4,
        }}>
            <Text style={{color: contrastColor, fontSize: 11, textAlign: 'center'}} numberOfLines={2}>
                {tile.name}
            </Text>
        </View>
    )
}
