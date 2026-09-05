import React, {useState} from "react";
import {ScrollView, TouchableOpacity, View} from "react-native";
import {Text, TextInput, useTheme} from "react-native-paper";
import {runOnJS, useAnimatedReaction} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {IconButton} from "@components/IconButton";
import {getContrastColor} from "@components/Colors";
import {HS3Item, Routine, Tile} from "@components/homescreen/types";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";
import {GRID_COLUMNS, GRID_ROWS, pixelToGrid} from "@homescreen/move_algo";
import {clamp, doRectanglesOverlap, getNextId} from "@homescreen/util";
import {calculateNextPositionInFolder} from "@homescreen/crud/move_elements";

const TILE_SIZE = 88
const UNCATEGORIZED = 0
const DRAWER_OPEN_HEIGHT = 560
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
    const {tiles, routines, folders, dragPreview, homescreenAreaBounds} = useHomescreenData()
    const {colors} = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [activeRoutine, setActiveRoutine] = useState<number | typeof UNCATEGORIZED_KEY | undefined>(undefined)

    //drop handling for a tile dragged out of the drawer — placed at the root level only
    //for now; dropping into whichever folder popup happens to be open isn't supported yet.
    const handleDrop = (tile: Tile, absX: number, absY: number) => {
        const bounds = homescreenAreaBounds.value
        if (!bounds) return

        const localX = absX - bounds.x
        const localY = absY - bounds.y
        const droppedOnDrawer = localY > bounds.height - DRAWER_OPEN_HEIGHT
        const outOfBounds = localX < 0 || localY < 0 || localX > bounds.width || localY > bounds.height
        if (droppedOnDrawer || outOfBounds) return //dropped back onto the drawer, or off-screen — no-op

        const grid = pixelToGrid({x: localX, y: localY})
        const gx = clamp(grid.x, 0, GRID_COLUMNS - 1)
        const gy = clamp(grid.y, 0, GRID_ROWS - 1)

        const rootFolder = folders.value.find(f => f.folderId === undefined)
        const existingLayouts = [
            ...(rootFolder?.items.map(i => i.layout) ?? []),
            ...folders.value.filter(f => f.parentId === undefined && f.folderId !== undefined).map(f => f.layout),
        ]
        const wanted = {x: gx, y: gy, width: 1, height: 1}
        const isOccupied = existingLayouts.some(l => doRectanglesOverlap(l, wanted))
        const position = isOccupied ? calculateNextPositionInFolder(existingLayouts, 1, 1) : {x: gx, y: gy}

        const newItem: HS3Item = {
            itemId: getNextId("item", folders.value),
            tileId: tile.id,
            parentId: undefined,
            layout: {...position, width: 1, height: 1},
        }
        folders.value = folders.value.map(f =>
            f.folderId === undefined ? {...f, items: [...f.items, newItem]} : f
        )
    }

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
                height: isOpen ? DRAWER_OPEN_HEIGHT : 100,
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
                        placeholder="Suchen..."
                        value={query}
                        onChangeText={setQuery}
                        style={{marginBottom: 12}}
                    />
                    <ScrollView style={{flex: 1}}>
                        {isSearching
                            ? <TileGrid tiles={searchResults} emptyLabel="Keine Tiles gefunden."
                                        dragPreview={dragPreview} onDrop={handleDrop}/>
                            : activeGroup
                                ? <>
                                    <TouchableOpacity onPress={() => setActiveRoutine(undefined)}
                                                       style={{flexDirection: "row", alignItems: "center", marginBottom: 14}}>
                                        <Text variant="titleMedium" style={{opacity: 0.8}}>{"< "}
                                            {activeGroup.routine?.name ?? "Ohne Routine"}
                                        </Text>
                                    </TouchableOpacity>
                                    <TileGrid tiles={activeGroup.tiles} dragPreview={dragPreview} onDrop={handleDrop}/>
                                </>
                                : <RoutineGrid groups={groups} onSelect={setActiveRoutine}/>}
                    </ScrollView>
                </View>
            )}
        </View>
    )
}

//Routines are organizational "folders", not content — shown as an outline (base surface
//fill, colored stroke + text) so they read as distinct from the filled, color-coded tiles
//they contain.
const RoutineGrid = ({groups, onSelect}: {
    groups: RoutineGroup[]
    onSelect: (key: number | typeof UNCATEGORIZED_KEY) => void
}) => {
    const {colors} = useTheme()

    return (
        <View style={{flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 12}}>
            {groups.map(group => {
                const color = group.routine?.color ?? colors.onSurfaceVariant
                return (
                    <TouchableOpacity key={group.key} onPress={() => onSelect(group.key)}>
                        <View style={{
                            width: TILE_SIZE, height: TILE_SIZE,
                            backgroundColor: colors.elevation.level3,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: color,
                            alignItems: 'center', justifyContent: 'center',
                            padding: 6,
                        }}>
                            <Text style={{color, fontSize: 13, fontWeight: "600", textAlign: 'center'}}
                                  numberOfLines={2}>
                                {group.routine?.name ?? "Ohne Routine"}
                            </Text>
                            <Text style={{color, fontSize: 11, opacity: 0.8}}>
                                {group.tiles.length}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )
            })}
            {groups.length === 0 && (
                <Text style={{opacity: 0.6}}>Keine Tiles vorhanden.</Text>
            )}
        </View>
    )
}

type DragProps = {
    dragPreview: ReturnType<typeof useHomescreenData>["dragPreview"]
    onDrop: (tile: Tile, absX: number, absY: number) => void
}

const TileGrid = ({tiles, emptyLabel, dragPreview, onDrop}: { tiles: Tile[], emptyLabel?: string } & Partial<DragProps>) => (
    <View style={{flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 12}}>
        {tiles.map(tile => <AppDrawerTile key={tile.id} tile={tile} dragPreview={dragPreview} onDrop={onDrop}/>)}
        {tiles.length === 0 && !!emptyLabel && (
            <Text style={{opacity: 0.6}}>{emptyLabel}</Text>
        )}
    </View>
)

const AppDrawerTile = ({tile, dragPreview, onDrop}: { tile: Tile } & Partial<DragProps>) => {
    const contrastColor = getContrastColor(tile.color)

    const dragGesture = Gesture.Pan()
        .onStart((e) => {
            if (dragPreview) dragPreview.value = {tile, x: e.absoluteX, y: e.absoluteY}
        })
        .onUpdate((e) => {
            if (dragPreview) dragPreview.value = {tile, x: e.absoluteX, y: e.absoluteY}
        })
        .onEnd((e) => {
            if (dragPreview) dragPreview.value = undefined
            if (onDrop) runOnJS(onDrop)(tile, e.absoluteX, e.absoluteY)
        })

    const content = (
        <View style={{
            width: TILE_SIZE, height: TILE_SIZE,
            backgroundColor: tile.color,
            borderRadius: 12,
            alignItems: 'center', justifyContent: 'center',
            padding: 6,
        }}>
            <Text style={{color: contrastColor, fontSize: 13, fontWeight: "600", textAlign: 'center'}} numberOfLines={2}>
                {tile.name}
            </Text>
        </View>
    )

    return (dragPreview && onDrop)
        ? <GestureDetector gesture={dragGesture}>{content}</GestureDetector>
        : content
}
