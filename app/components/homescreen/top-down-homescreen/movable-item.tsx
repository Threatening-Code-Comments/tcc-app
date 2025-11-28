import {HS3LayoutParams} from "@components/homescreen/3-homescreen/3_homescreenHandler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring
} from "react-native-reanimated";
import {GRID_UNIT} from "@components/homescreen/move_algo";
import React, {useEffect} from "react";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {PixelPoint} from "@components/homescreen/types";
import {SpringConfig} from "react-native-reanimated/lib/typescript/reanimated2/animation/springUtils";

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
}

export function MovableItem(props: MovableItemProps) {
    const {layout} = props;
    const {
        onTap = () => {
        }, onDragStart = () => {
        }, onDragUpdate = () => {
        }, onDragEnd = () => {
        }, onLongPress = () => {
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


    const compoundGesture =
        (props.isEditMode)
            ? Gesture.Exclusive(panGesture, tapGesture)
            : Gesture.Exclusive(tapGesture, longPress)

    const wrapperViewStyle = useAnimatedStyle(() => ({
        position: "absolute",
        left: itemX.value,
        top: itemY.value,
        transform: [
            {translateX: isDragging ? translateX.value : 0},
            {translateY: isDragging ? translateY.value : 0},
        ] as any,
        width: itemWidth.value * (isDragging ? n : 1),
        height: itemHeight.value * (isDragging ? n : 1),
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
            </Animated.View>
        </GestureDetector>
    </Animated.View>;
}