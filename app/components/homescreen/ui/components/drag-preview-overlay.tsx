import React, {useState} from "react";
import {Text} from "react-native-paper";
import Animated, {runOnJS, useAnimatedReaction, useAnimatedStyle} from "react-native-reanimated";
import {getContrastColor} from "@components/Colors";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";
import {GRID_UNIT, gridPointToPixel} from "@homescreen/move_algo";
import {getSnappedGridPosition} from "@homescreen/util";

const DRAG_TILE_SIZE = 88

/**
 * The App-Drawer-tile-onto-homescreen drag, mirroring how an in-homescreen drag looks:
 * a dragged tile that follows the pointer pixel-for-pixel (centered on it), with a
 * grid-snapped preview underneath showing the cell it'll actually land on (the same role
 * PreviewItem plays for a normal drag). AppDrawer and the homescreen area are siblings, so
 * this lives at their shared parent instead of either one.
 */
export const DragPreviewOverlay = () => {
    const {dragPreview, homescreenAreaBounds} = useHomescreenData()

    //bridges dragPreview.value's tile changing (start/end of a drag) into a re-render, so
    //the label below reflects it — position itself stays fully worklet-driven via style.
    const [, setRefreshTick] = useState(false)
    useAnimatedReaction(
        () => dragPreview.value?.tile.id,
        (current, previous) => {
            if (current !== previous) runOnJS(setRefreshTick)(t => !t)
        }, [dragPreview]
    )

    //both branches of each style return the exact same keys on purpose — Reanimated doesn't
    //reset a key that disappears between frames (the value just sticks natively).
    const snapStyle = useAnimatedStyle(() => {
        const active = !!dragPreview.value && !!homescreenAreaBounds.value
        const bounds = homescreenAreaBounds.value
        const preview = dragPreview.value

        let left = 0, top = 0
        if (active && preview && bounds) {
            const localPoint = {x: preview.x - bounds.x, y: preview.y - bounds.y}
            const px = gridPointToPixel(getSnappedGridPosition(localPoint, 1, 1))
            left = px.x
            top = px.y
        }

        return {
            opacity: active ? 1 : 0,
            position: "absolute",
            left, top,
            width: GRID_UNIT,
            height: GRID_UNIT,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: preview?.tile.color ?? "transparent",
            backgroundColor: "transparent",
            zIndex: 2900,
        }
    })

    const dragTileStyle = useAnimatedStyle(() => {
        const active = !!dragPreview.value && !!homescreenAreaBounds.value
        const bounds = homescreenAreaBounds.value
        const preview = dragPreview.value

        let left = 0, top = 0
        if (active && preview && bounds) {
            left = preview.x - bounds.x - DRAG_TILE_SIZE / 2
            top = preview.y - bounds.y - DRAG_TILE_SIZE / 2
        }

        return {
            opacity: active ? 1 : 0,
            position: "absolute",
            left, top,
            width: DRAG_TILE_SIZE,
            height: DRAG_TILE_SIZE,
            borderRadius: 12,
            backgroundColor: preview?.tile.color ?? "transparent",
            zIndex: 3000,
            alignItems: "center",
            justifyContent: "center",
        }
    })

    return (
        <>
            <Animated.View style={snapStyle} pointerEvents="none"/>
            <Animated.View style={dragTileStyle} pointerEvents="none">
                {!!dragPreview.value && (
                    <Text
                        style={{color: getContrastColor(dragPreview.value.tile.color), fontSize: 13, fontWeight: "600", textAlign: "center"}}
                        numberOfLines={2}>
                        {dragPreview.value.tile.name}
                    </Text>
                )}
            </Animated.View>
        </>
    )
}
