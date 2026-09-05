import React, {useState} from "react";
import {Text} from "react-native-paper";
import Animated, {runOnJS, useAnimatedReaction, useAnimatedStyle} from "react-native-reanimated";
import {getContrastColor} from "@components/Colors";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

const SIZE = 88

/**
 * The floating tile that follows the finger while dragging an App Drawer tile onto the
 * homescreen — the only visible feedback for that cross-component drag (AppDrawer and the
 * homescreen area are siblings, so this lives at the shared parent instead of either one).
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

    //TEMP DEBUG: logs the raw values driving this overlay's position every time the drag
    //moves, since the box has been reported invisible twice now despite the drop itself
    //(which uses the exact same bounds/coordinate math) working correctly.
    useAnimatedReaction(
        () => ({preview: dragPreview.value, bounds: homescreenAreaBounds.value}),
        (curr) => {
            if (curr.preview) {
                console.log("[DragPreviewOverlay]", JSON.stringify(curr))
            }
        }, [dragPreview, homescreenAreaBounds]
    )

    //both branches return the exact same style keys on purpose — Reanimated doesn't reset
    //a key that disappears between frames (the value just sticks natively), which bit this
    //same "different-shaped branches" pattern earlier in this file's siblings.
    const style = useAnimatedStyle(() => {
        const active = !!dragPreview.value && !!homescreenAreaBounds.value
        const bounds = homescreenAreaBounds.value
        const preview = dragPreview.value

        const x = (active && preview && bounds) ? preview.x - bounds.x - SIZE / 2 : 0
        const y = (active && preview && bounds) ? preview.y - bounds.y - SIZE / 2 : 0

        return {
            opacity: active ? 1 : 0,
            position: "absolute",
            left: x,
            top: y,
            width: SIZE,
            height: SIZE,
            borderRadius: 12,
            borderWidth: 4,
            borderColor: "lime",
            backgroundColor: preview?.tile.color ?? "magenta",
            zIndex: 3000,
            alignItems: "center",
            justifyContent: "center",
        }
    })

    return (
        <Animated.View style={style} pointerEvents="none">
            <Text
                style={{color: "yellow", fontSize: 13, fontWeight: "900", textAlign: "center"}}
                numberOfLines={2}>
                {dragPreview.value?.tile.name ?? "DEBUG"}
            </Text>
        </Animated.View>
    )
}
