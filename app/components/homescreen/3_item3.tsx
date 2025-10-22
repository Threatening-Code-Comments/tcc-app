import React, {useEffect, useState} from "react";
import {StyleSheet} from "react-native";
import Animated, {runOnJS, useAnimatedStyle, useSharedValue, withSpring} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
    Gesture,
    GestureDetector,
    GestureUpdateEvent,
    PanGestureHandlerEventPayload
} from "react-native-gesture-handler";
import {HS3Element, HS3Item} from "@components/homescreen/3_homescreenHandler";
import {PixelPoint} from "@components/homescreen/types";

type Props = HS3Item & {
    onDragUpdate?: (point: PixelPoint) => void;
    snapToNearestGridPoint: (value: number) => number
    handleDragEnd: (id: number, pixel: PixelPoint) => void
}
const Item3 = ({
                   layout: {x, y, width, height},
                   itemId,

                   onDragUpdate: onDragUpdateP,
                   snapToNearestGridPoint, handleDragEnd: handleDragEndP,
               }: Props) => {
    const itemX = useSharedValue<number>(x);
    const itemY = useSharedValue<number>(y);
    const translateX = useSharedValue<number>(0);
    const translateY = useSharedValue<number>(0);
    const itemWidth = useSharedValue<number>(width);
    const itemHeight = useSharedValue<number>(height);

    const [isDragging, setIsDragging] = useState(false);
    useEffect(() => {
        itemX.value = x;
        itemY.value = y;
    }, [x, y]);

    const onDragStart = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        setIsDragging(true);
        // isSticky.value = true; // Reset sticky state on drag start
    };
    const onDragUpdate = (
        event: GestureUpdateEvent<PanGestureHandlerEventPayload>
    ) => {
        // hier muss drag (preview) item aktualisiert werden weil flüssig
        translateX.value = withSpring(event.translationX);
        translateY.value = withSpring(event.translationY);

        runOnJS(onDragUpdateP)({x: itemX.value + translateX.value, y: itemY.value + translateY.value});
    };
    const onDragEnd = () => {
        setIsDragging(false);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        const currentX = itemX.value + translateX.value;
        const currentY = itemY.value + translateY.value;
        const newX = snapToNearestGridPoint(currentX);
        const newY = snapToNearestGridPoint(currentY);

        // Calculate the final translate values needed to reach the snapped position
        const oldX = itemX.value
        const oldY = itemY.value
        const finalTranslateX = newX - itemX.value;
        const finalTranslateY = newY - itemY.value;

        translateX.value = withSpring(finalTranslateX, {duration: 1}, (finished) => {
            itemX.value = oldX + finalTranslateX
            if (finished) {
                itemX.value = newX;
                translateX.value = 0;
            }
        });

        translateY.value = withSpring(finalTranslateY, {duration: 1}, (finished) => {
            itemY.value = oldY + finalTranslateY
            if (finished) {
                itemY.value = newY;
                translateY.value = 0;
            }
        });

        handleDragEndP(itemId, ({x: newX, y: newY}));
    };

    const dragGesture = Gesture.Pan()
        .onStart(() => runOnJS(onDragStart)())
        .onUpdate((event) => runOnJS(onDragUpdate)(event))
        .onEnd(() => runOnJS(onDragEnd)());

    const animatedStyle = useAnimatedStyle(() => ({
        width: itemWidth.value,
        height: itemHeight.value,
        transform: [
            {translateX: translateX.value},
            {translateY: translateY.value},
        ] as any,
        left: itemX.value,
        top: itemY.value,
        backgroundColor: "#4A90E2",
    }));
    return (
        <GestureDetector gesture={dragGesture}>
            <Animated.View style={[styles.item, animatedStyle]}>

            </Animated.View>
        </GestureDetector>
    );
}

export default Item3;

const styles = StyleSheet.create({
    item: {
        backgroundColor: "#4A90E2",
        position: "absolute",
    },
    previewItem: {
        backgroundColor: "#4A90E233",
        position: "absolute",
        borderColor: "#4A90E2",
        borderWidth: 2,
        elevation: 1,
    },
});
