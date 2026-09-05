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

//TEMP DEBUG: bypasses useHomescreenData() so the design is visible regardless of whether
//the context data is actually reaching this component. Also drives the on-screen
//"ctx tiles/routines" line below, which tells us whether the real bug is upstream (context
//never populated / never reaches AppDrawer) or in AppDrawer's own rendering. Remove both
//once the real bug is found.
const HARDCODED_ROUTINES: Routine[] = [
    {id: 1, name: "Konsum", color: "#e67e22"},
    {id: 2, name: "Diabetes", color: "#2980b9"},
    {id: 3, name: "Haushalt", color: "#27ae60"},
]
const HARDCODED_TILES: Tile[] = [
    {id: 1, name: "Döner", mode: 0, rootRoutineId: 3, color: "#e74c3c", events: []},
    {id: 2, name: "Einkaufen", mode: 0, rootRoutineId: 0, color: "#9b59b6", events: []},
    {id: 3, name: "Koffein", mode: 0, rootRoutineId: 1, color: "#f1c40f", events: []},
    {id: 4, name: "Alkohol", mode: 0, rootRoutineId: 1, color: "#e67e22", events: []},
    {id: 5, name: "Blutzucker gemessen", mode: 0, rootRoutineId: 2, color: "#1abc9c", events: []},
]

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

    const allTiles = HARDCODED_TILES
    const allRoutines = HARDCODED_ROUTINES
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
