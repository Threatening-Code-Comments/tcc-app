import React, {useEffect} from "react";
import {StyleSheet} from "react-native";
import Animated, {runOnJS, useAnimatedStyle, useSharedValue, withSpring} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
    Gesture,
    GestureDetector,
    GestureStateChangeEvent,
    GestureUpdateEvent,
    PanGestureHandlerEventPayload
} from "react-native-gesture-handler";
import {HS3Item} from "@components/homescreen/3_homescreenHandler";
import {PixelPoint} from "@components/homescreen/types";
import {Text} from "react-native-paper";
import {gridPointToPixel, gridToPx, pxToGrid} from "@components/homescreen/move_algo";

export const FOLDER_HOVER_OVERLAY_INSET_STRING = "65%"
export const FOLDER_HOVER_OVERLAY_INSET = 0.65

type Props = HS3Item & {
    onDragUpdate?: (point: PixelPoint) => void,
    snapToNearestGridPoint: (value: number) => number,
    handleDragEnd: (pixel: PixelPoint) => void,
    gridUnit: number,
}
const Item3 = ({
                   layout: {x, y, width, height},
                   itemId,
                   parentId,
                   onDragUpdate: onDragUpdateP,
                   snapToNearestGridPoint,
                   handleDragEnd: handleDragEndP,
                   gridUnit,
               }: Props) => {
    const selfItem: HS3Item = {
        itemId,
        layout: {x, y, width, height},
        parentId
    }
    const itemX = useSharedValue<number>(x * gridUnit);
    const itemY = useSharedValue<number>(y * gridUnit);
    const translateX = useSharedValue<number>(0);
    const translateY = useSharedValue<number>(0);
    const itemWidth = useSharedValue<number>(width * gridUnit);
    const itemHeight = useSharedValue<number>(height * gridUnit);

    const isDragging = useSharedValue<boolean>(false);
    useEffect(() => {
        itemX.value = x * gridUnit;
        itemY.value = y * gridUnit;
    }, [x, y]);

    const onDragStart = (e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        isDragging.value = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        // isSticky.value = true; // Reset sticky state on drag start

        const M = {
            x: itemX.value + itemWidth.value / 2,
            y: itemY.value + itemHeight.value / 2,
        }

        const dragStartPoint = {
            x: itemX.value + e.x,
            y: itemY.value + e.y
        }

        translateX.value = 0 // dragStartPoint.x - M.x
        translateY.value = 0 //dragStartPoint.y - M.y
        itemX.value = itemX.value + dragStartPoint.x - M.x
        itemY.value = itemY.value + dragStartPoint.y - M.y
    };
    const onDragUpdate = (
        event: GestureUpdateEvent<PanGestureHandlerEventPayload>
    ) => {
        // hier muss drag (preview) item aktualisiert werden weil flüssig
        translateX.value = withSpring(event.translationX)
        translateY.value = withSpring(event.translationY)

        runOnJS(onDragUpdateP)({
            x: itemX.value + translateX.value + itemWidth.value / 2, //center the 'aiming point'
            y: itemY.value + translateY.value + itemHeight.value / 2,
        });
    };
    const onDragEnd = () => {
        isDragging.value = false;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        const currentX = itemX.value + translateX.value;
        const currentY = itemY.value + translateY.value;
        const newX = snapToNearestGridPoint(currentX);
        const newY = snapToNearestGridPoint(currentY);

        translateY.value = 0
        translateX.value = 0

        handleDragEndP(({x: newX, y: newY}));
        return

        // Calculate the final translate values needed to reach the snapped position
        const oldX = itemX.value
        const oldY = itemY.value
        const finalTranslateX = newX - itemX.value;
        const finalTranslateY = newY - itemY.value;

        translateX.value = withSpring(finalTranslateX, {duration: 0.5}, (finished) => {
            itemX.value = oldX + finalTranslateX
            if (finished) {
                itemX.value = newX;
                translateX.value = 0;
            }
        });

        translateY.value = withSpring(finalTranslateY, {duration: 0.5}, (finished) => {
            itemY.value = oldY + finalTranslateY
            if (finished) {
                itemY.value = newY;
                translateY.value = 0;
            }
        });

        handleDragEndP(({x: newX, y: newY}));
    };

    const dragGesture = Gesture.Pan()
        .onStart((e) => runOnJS(onDragStart)(e))
        .onUpdate((event) => runOnJS(onDragUpdate)(event))
        .onEnd(() => runOnJS(onDragEnd)());

    const n = FOLDER_HOVER_OVERLAY_INSET

    const animatedStyle = useAnimatedStyle(() => ({
        width: itemWidth.value * (isDragging.value ? n : 1),
        height: itemHeight.value * (isDragging.value ? n : 1),
        transform: [
            {translateX: translateX.value},
            {translateY: translateY.value},
        ] as any,
        left: itemX.value + (isDragging.value ? itemWidth.value * n / 2 : 0),
        top: itemY.value + (isDragging.value ? itemHeight.value * n / 2 : 0),
        elevation: isDragging.value ? 8 : 0,
        zIndex: isDragging.value ? 8 : 1,
    }));

    // const folderTargetStyle = useAnimatedStyle(() => ({
    //     position: "absolute",
    //     height: FOLDER_HOVER_OVERLAY_INSET_STRING,
    //     width: FOLDER_HOVER_OVERLAY_INSET_STRING,
    //     left: (1 - FOLDER_HOVER_OVERLAY_INSET) * itemWidth.value / 2,
    //     top: (1 - FOLDER_HOVER_OVERLAY_INSET) * itemHeight.value / 2,
    //
    //     backgroundColor: isAddFolderP ? "green" : "yellow",
    //     opacity: isDragging.value ? 0 : 1,
    // }))

    return (
        <GestureDetector gesture={dragGesture}>
            <Animated.View style={[styles.item, animatedStyle]}>
                <Text>ID: {itemId}</Text>
                <Text>x:{pxToGrid(itemX.value)} y: {pxToGrid(itemY.value)}</Text>
                {/*<Text>{isDragging.value}</Text>*/}
                <Text>{Math.round(translateX.value)} || {Math.round(translateY.value)}</Text>
            </Animated.View>
        </GestureDetector>
    );
}

export default Item3;

const styles = StyleSheet.create({
    item: {
        backgroundColor: "#914ae2",
        position: "absolute",

        borderColor: "#000",
        borderWidth: 1,
    },
    previewItem: {
        backgroundColor: "#4A90E233",
        position: "absolute",
        borderColor: "#4A90E2",
        borderWidth: 2,
        elevation: 1,
    },
});

export enum Dirs {
    moveLeft = "moveLeft",
    moveRight = "moveRight",
    moveUp = "moveUp",
    moveDown = "moveDown",
}

type CheckDirsReturnType = {
    dirs: Dirs[]
    isAddFolder: boolean
}
export const checkDirectionsForItem: (item: HS3Item, point: PixelPoint, doesCollide: boolean) => CheckDirsReturnType
    = (item, point, doesCollide) => {
    "worklet"

    if (!doesCollide)
        return { dirs: [], isAddFolder: false }

    const {x, y} = point
    const n = FOLDER_HOVER_OVERLAY_INSET;

    const o = gridPointToPixel({x: item.layout.x, y: item.layout.y})
    const wO = gridToPx(item.layout.width)
    const hO = gridToPx(item.layout.height)

    const wiX = wO * n
    const wiY = hO * n
    const siX = (wO * (1 - n)) / 2
    const siY = (hO * (1 - n)) / 2

    const dirs = []
    // const isMoveRight =
    //     (o.x) < x && x < (o.x + siX) // hits left most space between item border and
    //     && (o.y) < y && y < (o.y + hO)  // folder creation thing
    // const isMoveLeft =
    //     (o.x + siX + wiX) < x && x < (o.x + wO) // left side is capped, only the right
    //     && (o.y) < y && y < (o.y + hO)                // side
    // const isMoveDown =
    //     (o.x) < x && x < (o.x + wO)
    //     && (o.y) < y && y < (o.y + siY)       // top space is target
    // const isMoveUp =
    //     (o.x) < x && x < (o.x + wO)
    //     && (o.y + siY + wiY) < y && y < (o.y + hO)  // bottom space is target
    const isMoveRight = point.x < o.x + siX // is to the left of folder creation thing (because we know there is a collision)
    const isMoveLeft = point.x > o.x + siX + wiX // is to the right of folder creation thing (because we know there is a collision)
    const isMoveUp = point.y < o.y + siY
    const isMoveDown = point.y > o.y + siY + wiY

    const isAddFolder =
        (o.x + siX) < x && x < (o.x + siX + wiX)
        && (o.y + siY) < y && y < (o.y + siY + wiY)

    if (isMoveRight) dirs.push(Dirs.moveRight)
    if (isMoveLeft) dirs.push(Dirs.moveLeft)
    if (isMoveDown) dirs.push(Dirs.moveDown)
    if (isMoveUp) dirs.push(Dirs.moveUp)

    return {
        dirs: dirs,
        isAddFolder: isAddFolder,
    }
}
