import {HS3LayoutParams} from "@components/homescreen/3-homescreen/3_homescreenHandler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring
} from "react-native-reanimated";
import {GRID_UNIT, pxToGrid} from "@components/homescreen/move_algo";
import React, {useEffect} from "react";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {PixelPoint, PixelValue} from "@components/homescreen/types";
import {SpringConfig} from "react-native-reanimated/lib/typescript/reanimated2/animation/springUtils";
import {View} from "react-native";
import {DragPoint, DragPointPosition} from "@components/homescreen/top-down-homescreen/drag-point";

/**
 * this scales the item down when it's dragging
 */
export const n = 0.8

export type MovableItemProps = {
    layout: HS3LayoutParams
    onTap?: () => void
    onDragStart?: () => void
    onDragUpdate?: (coordinate: PixelPoint) => void
    onDragEnd?: () => void
    onLongPress?: (coordinate: PixelPoint) => void
    isEditMode?: boolean
    children?: React.ReactNode
    onResizeUpdate?: (pos: DragPointPosition, deltaX: PixelValue, deltaY: PixelValue) => void
    onResizeEnd?: (pos: DragPointPosition) => void
}

export function MovableItem(props: MovableItemProps) {
    const {layout} = props;
    const {
        onTap = () => {
        }, onDragStart = () => {
        }, onDragUpdate = () => {
        }, onDragEnd = () => {
        }, onLongPress = () => {
        }, onResizeUpdate: onResizeUpdateP = () => {
        }, onResizeEnd: onResizeEndP = () => {
        }
    } = props

    const [isDragging, setDragging] = React.useState(false);
    const itemX =
        useDerivedValue(() => layout.x * GRID_UNIT, [layout.x])
    const itemY =
        useDerivedValue(() => layout.y * GRID_UNIT, [layout.y])
    const itemWidth =
        useDerivedValue(() => layout.width * GRID_UNIT, [layout.width])
    const itemHeight =
        useDerivedValue(() => layout.height * GRID_UNIT, [layout.height])

    const startX = useSharedValue(0);
    const startY = useSharedValue(0);
    const translateX = useSharedValue<number>(0)
    const translateY = useSharedValue<number>(0)
    useEffect(() => {
        if (!isDragging) {
            translateX.value = 0;
            translateY.value = 0;
        }
    }, [isDragging])

    const panGesture = Gesture.Pan()
        .onStart((e) => {
            runOnJS(setDragging)(true);

            startX.value = -((itemWidth.value * n / 2) - e.x);
            startY.value = -((itemWidth.value * n / 2) - e.y);
            runOnJS(onDragStart)()
        })
        .onUpdate((event) => {
            const config: SpringConfig = {
                // duration: 20
            }
            translateX.value = withSpring(startX.value + event.translationX, config);
            translateY.value = withSpring(startY.value + event.translationY, config);

            runOnJS(onDragUpdate)({
                x: itemX.value + translateX.value + itemWidth.value / 2,
                y: itemY.value + translateY.value + itemHeight.value / 2,
            });
        })
        .onEnd(() => {
            runOnJS(setDragging)(false);
            runOnJS(onDragEnd)();
        });
    const tapGesture = Gesture.Tap()
        .onStart((e) => {
            runOnJS(onTap)()
        })
    const longPress = Gesture.LongPress()
        .onStart((e) => {
            const coordinate: PixelPoint = {
                x: e.x,//e.absoluteX,
                y: e.y,
            }
            runOnJS(onLongPress)(coordinate)
        })

    const onResizeUpdate = (pos: DragPointPosition, deltaX: number, deltaY: number) => {
        switch (pos) {
            case "right": {
                resizeRight.value = deltaX;
                break
            }
            case "bottom": {
                resizeBottom.value = deltaY;
                break
            }
            case "top": {
                resizeTop.value = deltaY;
                break
            }
            case "left": {
                resizeLeft.value = deltaX;
                break
            }
        }

        runOnJS(onResizeUpdateP)(pos, pxToGrid(deltaX), pxToGrid(deltaY))
    }
    const onResizeEnd = (pos: DragPointPosition) => {
        resizeLeft.value = 0
        resizeRight.value = 0
        resizeTop.value = 0
        resizeBottom.value = 0
        runOnJS(onResizeEndP)(pos)
    }
    const resizeLeft = useSharedValue(0);
    const resizeRight = useSharedValue(0);
    const resizeTop = useSharedValue(0);
    const resizeBottom = useSharedValue(0);

    const compoundGesture =
        (props.isEditMode)
            ? Gesture.Exclusive(panGesture, tapGesture)
            : Gesture.Exclusive(tapGesture, longPress)

    const wrapperViewStyle = useAnimatedStyle(() => ({
        position: "absolute",
        left: itemX.value + resizeLeft.value,
        top: itemY.value + resizeTop.value,
        transform: [
            {translateX: isDragging ? translateX.value : 0},
            {translateY: isDragging ? translateY.value : 0},
        ] as any,
        width: itemWidth.value * (isDragging ? n : 1) + resizeRight.value - resizeLeft.value,
        height: itemHeight.value * (isDragging ? n : 1) + resizeBottom.value - resizeTop.value,
        zIndex: isDragging ? 11 : 1,
    }), [itemX, itemY, itemHeight, itemWidth, translateX, translateY, isDragging]);

    return <Animated.View
        style={wrapperViewStyle}
    >
        <GestureDetector gesture={compoundGesture}>
            <Animated.View
                style={{
                    width: '100%', height: '100%',
                    justifyContent: 'center', alignItems: 'center'
                }}>
                {props.children}
                <View style={{
                    position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                    opacity: (props.isEditMode && !isDragging) ? 1 : 0
                }}>
                    <DragPoint position={"right"} onResizeEnd={onResizeEnd} onResizeUpdate={onResizeUpdate}/>
                    <DragPoint position={"bottom"} onResizeEnd={onResizeEnd} onResizeUpdate={onResizeUpdate}/>
                    <DragPoint position={"top"} onResizeEnd={onResizeEnd} onResizeUpdate={onResizeUpdate}/>
                    <DragPoint position={"left"} onResizeEnd={onResizeEnd} onResizeUpdate={onResizeUpdate}/>
                </View>
            </Animated.View>
        </GestureDetector>
    </Animated.View>;
}