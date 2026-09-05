import React, {useState} from "react";
import {ScrollView, View} from "react-native";
import {Card, Text, TextInput} from "react-native-paper";
import {runOnJS, useAnimatedReaction} from "react-native-reanimated";
import {IconButton} from "@components/IconButton";
import {getContrastColor} from "@components/Colors";
import {Tile} from "@components/homescreen/types";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

const TILE_SIZE = 70

/**
 * The tile library, browsable/searchable — flat, no nested folders here (the homescreen
 * already has folders for spatial organization; a second hierarchy in the drawer would
 * just be redundant). Drag-out onto the homescreen isn't built yet — this is search +
 * display only for now.
 */
export function AppDrawer() {
    const {tiles} = useHomescreenData()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")

    //bridges tiles.value changes (e.g. a new tile created elsewhere) into a re-render,
    //same pattern used throughout the homescreen for SharedValue-backed React reads.
    const [, setRefreshTick] = useState(false)
    useAnimatedReaction(
        () => tiles.value.length,
        (current, previous) => {
            if (current !== previous) runOnJS(setRefreshTick)(t => !t)
        }, [tiles]
    )

    const toggleModal = () => setIsOpen(v => !v)

    const filteredTiles = tiles.value.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase())
    )

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
                    <TextInput
                        mode="outlined"
                        dense
                        placeholder="Suchen..."
                        value={query}
                        onChangeText={setQuery}
                        style={{marginBottom: 8}}
                    />
                    <ScrollView>
                        <View style={{flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 12}}>
                            {filteredTiles.map(tile => (
                                <AppDrawerTile key={tile.id} tile={tile}/>
                            ))}
                            {filteredTiles.length === 0 && (
                                <Text style={{opacity: 0.6}}>Keine Tiles gefunden.</Text>
                            )}
                        </View>
                    </ScrollView>
                </View>
            )}
        </Card>
    )
}

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
