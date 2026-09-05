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

    const style = useAnimatedStyle(() => {
        if (!dragPreview.value || !homescreenAreaBounds.value) {
            return {opacity: 0, left: 0, top: 0, width: 0, height: 0, backgroundColor: "transparent"}
        }
        const {x, y} = dragPreview.value
        const bounds = homescreenAreaBounds.value

        return {
            opacity: 1,
            position: "absolute",
            left: x - bounds.x - SIZE / 2,
            top: y - bounds.y - SIZE / 2,
            width: SIZE,
            height: SIZE,
            borderRadius: 12,
            backgroundColor: dragPreview.value.tile.color,
            zIndex: 3000,
            alignItems: "center",
            justifyContent: "center",
        }
    })

    return (
        <Animated.View style={style} pointerEvents="none">
            {!!dragPreview.value && (
                <Text
                    style={{color: getContrastColor(dragPreview.value.tile.color), fontSize: 13, fontWeight: "600", textAlign: "center"}}
                    numberOfLines={2}>
                    {dragPreview.value.tile.name}
                </Text>
            )}
        </Animated.View>
    )
}
