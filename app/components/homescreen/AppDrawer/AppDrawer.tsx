import React, {createContext, useContext, useRef, useState} from "react";
import {Alert, FlatList, Keyboard, Pressable, ScrollView, StyleSheet, TextInput as NativeTextInput, TouchableOpacity, View} from "react-native";
import {Text, TextInput, useTheme} from "react-native-paper";
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import {IconButton} from "@components/IconButton";
import {getContrastColor} from "@components/Colors";
import {Routine, Tile} from "@components/homescreen/types";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";
import {getAppDrawerDragPoint} from "@homescreen/util";
import {DRAWER_CANCEL_ZONE_HEIGHT} from "@homescreen/constants";
import {RemoveBadge} from "@homescreen/ui/components/remove-badge";

//fixed column count rather than a fixed tile size — a fixed 88px tile plus gaps came out
//at 3 columns on narrower phones and 4 on wider ones. Tile size is derived from the
//measured content width instead, so it's always exactly 4.
const COLUMNS = 4
const GAP = 10
const FALLBACK_TILE_SIZE = 80
const TileSizeContext = createContext(FALLBACK_TILE_SIZE)
const UNCATEGORIZED = 0
const DRAWER_OPEN_HEIGHT = 560
//a tile only starts dragging after being held this long — an instant pan took every touch
//away from the list, so a full routine was barely scrollable without grabbing a tile
const TILE_DRAG_DELAY_MS = 350
//same as the cancel bar that takes its place while dragging a tile out
const DRAWER_CLOSED_HEIGHT = DRAWER_CANCEL_ZONE_HEIGHT
//a fling faster than this (px/s) decides open/close on its own, regardless of how far it got
const FLING_VELOCITY = 500
const SNAP_SPRING = {damping: 22, stiffness: 220, overshootClamping: true}
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
 * Tiles drag out onto the homescreen; the edit toggle next to search switches to deleting
 * tiles from the library instead (the homescreen's own "×" only removes placements).
 */
export function AppDrawer() {
    const {tiles, routines, folders, dragPreview, homescreenAreaBounds, appDrawerDrop} = useHomescreenData()
    const {colors} = useTheme()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [activeRoutine, setActiveRoutine] = useState<number | typeof UNCATEGORIZED_KEY | undefined>(undefined)
    const [tileSize, setTileSize] = useState(FALLBACK_TILE_SIZE)
    const [isDeleteMode, setDeleteMode] = useState(false)

    //the real delete: the tile leaves the library, and every placement of it on the
    //homescreen goes with it — an item pointing at a tile that no longer exists is useless.
    const deleteTile = (tile: Tile) => {
        const placements = folders.value.flatMap(f => f.items).filter(i => i.tileId === tile.id).length
        Alert.alert(
            `Delete "${tile.name}"?`,
            placements > 0
                ? `It's also removed from the homescreen (${placements} placement(s)). This can't be undone.`
                : "This can't be undone.",
            [
                {text: "Cancel", style: "cancel"},
                {
                    text: "Delete", style: "destructive", onPress: () => {
                        folders.value = folders.value.map(f => ({...f, items: f.items.filter(i => i.tileId !== tile.id)}))
                        tiles.value = tiles.value.filter(t => t.id !== tile.id)
                    }
                },
            ]
        )
    }

    //a tile dragged out of the drawer is resolved by the root Homescreen, which runs it
    //through its normal drag (preview, pushing neighbours away, folder create/move-into).
    //Dropping back onto the drawer's cancel bar (or off-screen) cancels — a no-op.
    const handleDrop = (tile: Tile, absX: number, absY: number) => {
        const cancelled = !getAppDrawerDragPoint({x: absX, y: absY}, homescreenAreaBounds.value)
        const placed = appDrawerDrop.current?.(cancelled) ?? false
        if (placed) close() //placed it — get out of the way and show the result
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

    //the drawer's height is driven directly (drag, then spring to open/closed), isOpen only
    //decides whether the content is mounted: it goes true as soon as the drawer starts moving
    //up and back to false once it has fully settled closed.
    const drawerHeight = useSharedValue(DRAWER_CLOSED_HEIGHT)
    const dragStartHeight = useSharedValue(DRAWER_CLOSED_HEIGHT)

    const finishClose = () => {
        setIsOpen(false)
        setDeleteMode(false)
    }
    const animateTo = (open: boolean) => {
        if (open) setIsOpen(true)
        else {
            setDeleteMode(false)
            //every way of closing (arrow, clickaway, pull down, placing a tile) ends here —
            //a still-focused search field would otherwise leave the keyboard up
            Keyboard.dismiss()
        }
        drawerHeight.value = withSpring(open ? DRAWER_OPEN_HEIGHT : DRAWER_CLOSED_HEIGHT, SNAP_SPRING, finished => {
            if (finished && !open) runOnJS(finishClose)()
        })
    }
    const toggleModal = () => animateTo(!isOpen)
    const close = () => animateTo(false)
    const open = () => {
        if (!isOpen) animateTo(true)
    }

    //pull the header up to open, down to close — the height follows the finger, then snaps
    //to whichever end the fling points at (or the nearer one for a slow release). Vertical
    //only, so taps on the arrow / search field and horizontal cursor drags still go through.
    const headerDragGesture = Gesture.Pan()
        .activeOffsetY([-10, 10])
        .failOffsetX([-20, 20])
        .onStart(() => {
            dragStartHeight.value = drawerHeight.value
            runOnJS(setIsOpen)(true)
        })
        .onUpdate(e => {
            drawerHeight.value = Math.min(DRAWER_OPEN_HEIGHT, Math.max(DRAWER_CLOSED_HEIGHT,
                dragStartHeight.value - e.translationY))
        })
        .onEnd(e => {
            const shouldOpen = Math.abs(e.velocityY) > FLING_VELOCITY
                ? e.velocityY < 0
                : drawerHeight.value > (DRAWER_OPEN_HEIGHT + DRAWER_CLOSED_HEIGHT) / 2
            runOnJS(animateTo)(shouldOpen)
        })

    //collapsed, the search field doesn't take touches itself (a native TextInput would
    //swallow them and the whole bar should pull up) — a plain tap focuses it instead, which
    //opens the drawer. Moving further than a tap fails it and leaves the drag to the pan.
    const searchInputRef = useRef<NativeTextInput>(null)
    const focusSearch = () => searchInputRef.current?.focus()
    const searchTapGesture = Gesture.Tap()
        .maxDistance(10)
        .onEnd((_e, success) => {
            if (success) runOnJS(focusSearch)()
        })

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

    //hidden (not unmounted, so isOpen/activeRoutine/query all survive) while one of its own
    //tiles is being dragged — it's just in the way of seeing the homescreen underneath.
    //Dropping back into this same area (still there, just invisible) still cancels the drag.
    const drawerStyle = useAnimatedStyle(() => ({
        height: drawerHeight.value,
        opacity: dragPreview.value ? 0 : 1,
    }))
    //the clickaway dims in step with how far the drawer is pulled up
    const clickawayStyle = useAnimatedStyle(() => ({
        opacity: dragPreview.value ? 0 : interpolate(drawerHeight.value,
            [DRAWER_CLOSED_HEIGHT, DRAWER_OPEN_HEIGHT], [0, 1], Extrapolation.CLAMP),
    }))
    //shown in the drawer's place while dragging — the visible, discoverable version of the
    //same cancel zone getAppDrawerDragPoint checks (dropping anywhere in this bar cancels).
    const cancelBarStyle = useAnimatedStyle(() => ({
        opacity: dragPreview.value ? 1 : 0,
    }))
    //grows the button when the drag is actually hovering the cancel zone — the same
    //localY math getAppDrawerDragPoint uses to decide whether a drop there cancels.
    const cancelButtonStyle = useAnimatedStyle(() => {
        if (!dragPreview.value || !homescreenAreaBounds.value) return {transform: [{scale: 1}]}
        const localY = dragPreview.value.y - homescreenAreaBounds.value.y
        const hovering = localY > homescreenAreaBounds.value.height - DRAWER_CANCEL_ZONE_HEIGHT
        return {transform: [{scale: hovering ? 1.15 : 1}]}
    })

    return (
        <>
        {/*clickaway: while open, a tap anywhere above the drawer closes it instead of
            reaching the homescreen underneath. Faded out along with the drawer while one of
            its tiles is dragged (the drag's own gesture keeps the touch either way).*/}
        {isOpen && (
            <Animated.View style={[StyleSheet.absoluteFill, {zIndex: 1998}, clickawayStyle]}>
                <Pressable style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.2)'}} onPress={close}/>
            </Animated.View>
        )}
        <Animated.View
            pointerEvents="none"
            style={[{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: "100%",
                height: DRAWER_CANCEL_ZONE_HEIGHT,
                zIndex: 1999,
                alignItems: "center",
                justifyContent: "center",
            }, cancelBarStyle]}
        >
            <Animated.View style={[{
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 24,
                backgroundColor: colors.errorContainer,
                borderWidth: 2,
                borderColor: colors.error,
            }, cancelButtonStyle]}>
                <Text style={{color: colors.onErrorContainer, fontWeight: "700"}}>Abbrechen</Text>
            </Animated.View>
        </Animated.View>
        <Animated.View
            style={[{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: "100%",
                zIndex: 2000,
                overflow: "hidden",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                backgroundColor: colors.elevation.level2,
                elevation: 8,
            }, drawerStyle]}
        >
            {/*header: grab handle + expand arrow + search, always visible — also the drag
                area for pulling the drawer open/closed. Focusing (or typing into) the search
                opens the drawer, so searching works straight from the collapsed bar.*/}
            <GestureDetector gesture={headerDragGesture}>
                <View style={{paddingHorizontal: 12, paddingBottom: 12}}>
                    <View style={{alignItems: "center", paddingVertical: 6}}>
                        <View style={{width: 36, height: 4, borderRadius: 2, backgroundColor: colors.onSurfaceVariant, opacity: 0.4}}/>
                    </View>
                    <View style={{flexDirection: "row", alignItems: "center", gap: 8}}>
                        <IconButton iconName={isOpen ? "arrowDown" : "arrowUp"} type={"transparent"}
                                    onPress={toggleModal}/>
                        <GestureDetector gesture={searchTapGesture}>
                        <View style={{flex: 1}} pointerEvents={isOpen ? "auto" : "box-only"}>
                        <TextInput
                            ref={searchInputRef}
                            mode="outlined"
                            dense
                            outlineStyle={{borderRadius: 24}}
                            placeholder="Apps suchen..."
                            value={query}
                            onChangeText={text => {
                                setQuery(text)
                                open()
                            }}
                            onFocus={open}
                        />
                        </View>
                        </GestureDetector>
                        {isOpen && (
                            <IconButton iconName={isDeleteMode ? "close" : "edit"}
                                        type={isDeleteMode ? "error" : "transparent"}
                                        onPress={() => setDeleteMode(v => !v)}/>
                        )}
                    </View>
                </View>
            </GestureDetector>

            {isOpen && (
                <View style={{flex: 1, paddingHorizontal: 12}}>
                    <TileSizeContext.Provider value={tileSize}>
                    {(() => {
                        //tile size still measured off the container's own width — a plain
                        //View onLayout, shared by whichever of the three views below mounts.
                        const measureTileSize = (width: number) => {
                            const size = Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS)
                            if (size > 0 && size !== tileSize) setTileSize(size)
                        }
                        const onLayout = e => measureTileSize(e.nativeEvent.layout.width)

                        if (isSearching) {
                            return <TileGrid tiles={searchResults} emptyLabel="Keine Tiles gefunden."
                                              dragPreview={dragPreview} onDrop={handleDrop}
                                              onDelete={isDeleteMode ? deleteTile : undefined} onLayout={onLayout}/>
                        }
                        if (activeGroup) {
                            const header = (
                                <TouchableOpacity onPress={() => setActiveRoutine(undefined)}
                                                   style={{flexDirection: "row", alignItems: "center", marginBottom: 14}}>
                                    <Text variant="titleMedium" style={{opacity: 0.8}}>{"< "}
                                        {activeGroup.routine?.name ?? "Ohne Routine"}
                                    </Text>
                                </TouchableOpacity>
                            )
                            return <TileGrid tiles={activeGroup.tiles} dragPreview={dragPreview} onDrop={handleDrop}
                                              onDelete={isDeleteMode ? deleteTile : undefined} header={header} onLayout={onLayout}/>
                        }
                        //~20 routines max, cheap TouchableOpacity items — a plain ScrollView
                        //is fine here, unlike the (up to 180+) individually pan-gesture-wrapped
                        //tiles above, which need a FlatList's windowing to not overwhelm the
                        //gesture handler with hundreds of simultaneously mounted recognizers.
                        return (
                            <ScrollView style={{flex: 1}} onLayout={onLayout}>
                                <RoutineGrid groups={groups} onSelect={setActiveRoutine}/>
                            </ScrollView>
                        )
                    })()}
                    </TileSizeContext.Provider>
                </View>
            )}
        </Animated.View>
        </>
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
    const tileSize = useContext(TileSizeContext)

    return (
        <View style={{flexDirection: "row", flexWrap: "wrap", gap: GAP, paddingBottom: 12}}>
            {groups.map(group => {
                const color = group.routine?.color ?? colors.onSurfaceVariant
                return (
                    <TouchableOpacity key={group.key} onPress={() => onSelect(group.key)}>
                        <View style={{
                            width: tileSize, height: tileSize,
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

type DeleteProps = {
    //set = delete mode: tiles show an "×" and aren't draggable
    onDelete?: (tile: Tile) => void
}

//a routine can hold 50+ tiles, and a broad search can match all of them at once — each
//AppDrawerTile carries its own GestureDetector/Pan recognizer, and mounting hundreds of
//those simultaneously (as the previous plain View+map inside a ScrollView did) overwhelms
//react-native-gesture-handler. FlatList only ever mounts what's near the viewport.
const TileGrid = ({tiles, emptyLabel, dragPreview, onDrop, onDelete, header, onLayout}: {
    tiles: Tile[], emptyLabel?: string, header?: React.ReactNode, onLayout?: (e: any) => void
} & Partial<DragProps> & DeleteProps) => (
    <FlatList
        style={{flex: 1}}
        onLayout={onLayout}
        data={tiles}
        keyExtractor={tile => String(tile.id)}
        numColumns={COLUMNS}
        columnWrapperStyle={{gap: GAP}}
        contentContainerStyle={{gap: GAP, paddingBottom: 12}}
        ListHeaderComponent={header as any}
        renderItem={({item}) => <AppDrawerTile tile={item} dragPreview={dragPreview} onDrop={onDrop} onDelete={onDelete}/>}
        ListEmptyComponent={!!emptyLabel ? <Text style={{opacity: 0.6}}>{emptyLabel}</Text> : null}
    />
)

const AppDrawerTile = ({tile, dragPreview, onDrop, onDelete}: { tile: Tile } & Partial<DragProps> & DeleteProps) => {
    const contrastColor = getContrastColor(tile.color)
    const tileSize = useContext(TileSizeContext)

    const dragGesture = Gesture.Pan()
        .activateAfterLongPress(TILE_DRAG_DELAY_MS)
        .onStart((e) => {
            if (dragPreview) dragPreview.value = {tile, x: e.absoluteX, y: e.absoluteY}
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
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
            width: tileSize, height: tileSize,
            backgroundColor: tile.color,
            borderRadius: 12,
            alignItems: 'center', justifyContent: 'center',
            padding: 6,
        }}>
            <Text style={{color: contrastColor, fontSize: 13, fontWeight: "600", textAlign: 'center'}} numberOfLines={2}>
                {tile.name}
            </Text>
            {onDelete && <RemoveBadge inset onPress={() => onDelete(tile)}/>}
        </View>
    )

    if (onDelete) return content
    return (dragPreview && onDrop)
        ? <GestureDetector gesture={dragGesture}>{content}</GestureDetector>
        : content
}
