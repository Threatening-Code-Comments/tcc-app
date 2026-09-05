import React, {useState} from "react";
import {ScrollView, TouchableOpacity, View} from "react-native";
import {Text, TextInput, useTheme} from "react-native-paper";
import {runOnJS, useAnimatedReaction} from "react-native-reanimated";
import {IconButton} from "@components/IconButton";
import {getContrastColor} from "@components/Colors";
import {Routine, Tile} from "@components/homescreen/types";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

const TILE_SIZE = 70
const UNCATEGORIZED = 0
//sentinel for the "no routine" bucket, distinct from a real routine.id and from
//Tile.rootRoutineId's own UNCATEGORIZED (0) value used for tile-to-routine matching.
const UNCATEGORIZED_KEY = "uncategorized"

type RoutineGroup = { key: number | typeof UNCATEGORIZED_KEY, routine?: Routine, tiles: Tile[] }

/**
 * The tile library, browsable/searchable. One level of grouping (by routine), shown as
 * flat "folders" you tap into — not everything expanded inline at once. With hundreds of
 * tiles, a flat list alone isn't enough, but a second nested level (routines inside pages,
 * like the production app) would add more complexity than it's worth here. Search ignores
 * the grouping and flattens across everything, the same way "open + search" already
 * substitutes for page-level quick access.
 * Drag-out onto the homescreen isn't built yet — this is browse + search only for now.
 */
export function AppDrawer() {
    const {tiles, routines} = useHomescreenData()
    const {colors} = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [activeRoutine, setActiveRoutine] = useState<number | typeof UNCATEGORIZED_KEY | undefined>(undefined)

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

    const groups: RoutineGroup[] = [
        ...allRoutines.map((routine): RoutineGroup => ({
            key: routine.id,
            routine,
            tiles: allTiles.filter(t => t.rootRoutineId === routine.id)
        })),
        {key: UNCATEGORIZED_KEY, routine: undefined, tiles: allTiles.filter(t => t.rootRoutineId === UNCATEGORIZED)} as RoutineGroup,
    ].filter(g => g.tiles.length > 0)

    const activeGroup = groups.find(g => g.key === activeRoutine)

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: "100%",
                height: isOpen ? 500 : 100,
                zIndex: 2000,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                backgroundColor: colors.elevation.level2,
                elevation: 8,
            }}
        >
            <View style={{alignItems: "center", justifyContent: "center", paddingTop: 8}}>
                <IconButton iconName={isOpen ? "arrowDown" : "arrowUp"} type={"transparent"}
                            onPress={toggleModal}
                            text={"Apps"}/>
            </View>

            {isOpen && (
                <View style={{flex: 1, paddingHorizontal: 12}}>
                    <TextInput
                        mode="outlined"
                        dense
                        placeholder="Suchen..."
                        value={query}
                        onChangeText={setQuery}
                        style={{marginBottom: 8}}
                    />
                    <ScrollView style={{flex: 1}}>
                        {isSearching
                            ? <TileGrid tiles={searchResults} emptyLabel="Keine Tiles gefunden."/>
                            : activeGroup
                                ? <>
                                    <TouchableOpacity onPress={() => setActiveRoutine(undefined)}
                                                       style={{flexDirection: "row", alignItems: "center", marginBottom: 10}}>
                                        <Text variant="labelLarge" style={{opacity: 0.8}}>{"< "}
                                            {activeGroup.routine?.name ?? "Ohne Routine"}
                                        </Text>
                                    </TouchableOpacity>
                                    <TileGrid tiles={activeGroup.tiles}/>
                                </>
                                : <RoutineGrid groups={groups} onSelect={setActiveRoutine}/>}
                    </ScrollView>
                </View>
            )}
        </View>
    )
}

const RoutineGrid = ({groups, onSelect}: {
    groups: RoutineGroup[]
    onSelect: (key: number | typeof UNCATEGORIZED_KEY) => void
}) => (
    <View style={{flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 12}}>
        {groups.map(group => (
            <TouchableOpacity key={group.key} onPress={() => onSelect(group.key)}>
                <View style={{
                    width: TILE_SIZE, height: TILE_SIZE,
                    backgroundColor: group.routine?.color ?? "#888888",
                    borderRadius: 10,
                    alignItems: 'center', justifyContent: 'center',
                    padding: 4,
                }}>
                    <Text style={{color: getContrastColor(group.routine?.color ?? "#888888"), fontSize: 11, textAlign: 'center'}}
                          numberOfLines={2}>
                        {group.routine?.name ?? "Ohne Routine"}
                    </Text>
                    <Text style={{color: getContrastColor(group.routine?.color ?? "#888888"), fontSize: 9, opacity: 0.8}}>
                        {group.tiles.length}
                    </Text>
                </View>
            </TouchableOpacity>
        ))}
        {groups.length === 0 && (
            <Text style={{opacity: 0.6}}>Keine Tiles vorhanden.</Text>
        )}
    </View>
)

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
