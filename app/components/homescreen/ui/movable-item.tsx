import {HS3LayoutParams} from "@homescreen/types";
import Animated, {
    runOnJS, useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from "react-native-reanimated";
import {GRID_UNIT, pxToGrid} from "@components/homescreen/move_algo";
import React, {useEffect, useMemo} from "react";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {PixelPoint, PixelValue} from "@components/homescreen/types";
import {SpringConfig} from "react-native-reanimated/lib/typescript/reanimated2/animation/springUtils";
import {View} from "react-native";
import {DragPoint, DragPointPosition} from "@components/homescreen/ui/components/drag-point";
import {RemoveBadge} from "@homescreen/ui/components/remove-badge";
import * as Haptics from "expo-haptics";

/**
 * this scales the item down when it's dragging
 */
export const n = 0.8

//outside edit mode an item is picked up iPhone-style: hold it this long, then either move
//(starts the drag, and the homescreen switches to edit mode) or let go (opens the popup)
const HOLD_TO_DRAG_MS = 350
//how far the finger has to move after the hold before it counts as a drag, not a long press
const HOLD_MOVE_SLOP = 8

export type MovableItemProps = {
    layout: HS3LayoutParams
    onTap?: () => void
    onDragStart?: () => void
    //must be a worklet — called on the UI thread on every pan update, without a JS hop
    onDragUpdate?: (coordinate: PixelPoint) => void
    onDragEnd?: () => void
    onLongPress?: (coordinate: PixelPoint) => void
    isEditMode?: boolean
    children?: React.ReactNode
    onResizeUpdate?: (pos: DragPointPosition, deltaX: PixelValue, deltaY: PixelValue) => void
    onResizeEnd?: (pos: DragPointPosition) => void
    //removes this placement from the homescreen — shown as an "×" in edit mode
    onRemove?: () => void
}

export function MovableItem(props: MovableItemProps) {
    const {layout} = props;
    const {
        onTap = () => {
        }, onDragStart = () => {
        }, onDragUpdate = () => {
            "worklet"
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

    //held but not moved yet (default mode only) / actually dragging
    const isHolding = useSharedValue(false)
    const isDragActive = useSharedValue(false)
    const beginDrag = () => {
        "worklet"
        isDragActive.value = true
        runOnJS(setDragging)(true);
        runOnJS(onDragStart)()
    }

    //one pan for both modes, so the gesture tree keeps its shape when a hold-drag switches
    //the homescreen into edit mode mid-gesture (a different tree would re-attach the
    //handlers and cancel the drag that's running)
    const panGesture = Gesture.Pan()
        .activateAfterLongPress(props.isEditMode ? 0 : HOLD_TO_DRAG_MS)
        .onStart((e) => {
            startX.value = -((itemWidth.value * n / 2) - e.x);
            startY.value = -((itemWidth.value * n / 2) - e.y);
            if (props.isEditMode) {
                beginDrag()
            } else {
                isHolding.value = true
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
            }
        })
        .onUpdate((event) => {
            if (!isDragActive.value) {
                if (!isHolding.value || Math.hypot(event.translationX, event.translationY) < HOLD_MOVE_SLOP) return
                isHolding.value = false
                beginDrag()
            }
            const config: SpringConfig = {
                // duration: 20
            }
            translateX.value = withSpring(startX.value + event.translationX, config);
            translateY.value = withSpring(startY.value + event.translationY, config);

            //the drag point is where the finger is: the centre of the (n-scaled) dragged item at
            //its target offset. It used to take the unscaled half size and the spring's current,
            //still-catching-up offset, which put it off to the side of (and behind) the finger —
            //noticeable on small targets like the folder popover's two halves.
            onDragUpdate({
                x: itemX.value + startX.value + event.translationX + itemWidth.value * n / 2,
                y: itemY.value + startY.value + event.translationY + itemWidth.value * n / 2,
            });
        })
        .onEnd((e) => {
            if (isDragActive.value) {
                // Moved to reaction of changed layout
                // runOnJS(setDragging)(false);
                runOnJS(onDragEnd)();
            } else if (isHolding.value) {
                runOnJS(onLongPress)({x: e.x, y: e.y})
            }
        })
        .onFinalize(() => {
            isHolding.value = false
            isDragActive.value = false
        });
    const tapGesture = Gesture.Tap()
        .onStart((e) => {
            runOnJS(onTap)()
        })
    const isResizing = useSharedValue(false);
    const onResizeUpdate = (pos: DragPointPosition, deltaX: number, deltaY: number) => {
        if (!isResizing.value) {
            isResizing.value = true
        }
        //never shrink below one grid cell — a 0-sized item crashes the app
        switch (pos) {
            case "right": {
                deltaX = Math.max(deltaX, GRID_UNIT - itemWidth.value)
                resizeRight.value = deltaX;
                break
            }
            case "bottom": {
                deltaY = Math.max(deltaY, GRID_UNIT - itemHeight.value)
                resizeBottom.value = deltaY;
                break
            }
            case "top": {
                deltaY = Math.min(deltaY, itemHeight.value - GRID_UNIT)
                resizeTop.value = deltaY;
                break
            }
            case "left": {
                deltaX = Math.min(deltaX, itemWidth.value - GRID_UNIT)
                resizeLeft.value = deltaX;
                break
            }
        }

        runOnJS(onResizeUpdateP)(pos, pxToGrid(deltaX), pxToGrid(deltaY))
    }
    const onResizeEnd = (pos: DragPointPosition) => {
        // resizeLeft.value = 0
        // resizeRight.value = 0
        // resizeTop.value = 0
        // resizeBottom.value = 0
        runOnJS(onResizeEndP)(pos)
    }
    const resizeLeft = useSharedValue(0);
    const resizeRight = useSharedValue(0);
    const resizeTop = useSharedValue(0);
    const resizeBottom = useSharedValue(0);

    //the tap only fires once the pan has failed, i.e. the finger let go before the hold
    const compoundGesture = Gesture.Exclusive(panGesture, tapGesture)

    //edit-mode wiggle — the "you can drag/resize this now" signal, replacing the old
    //screen-wide tint. Phase/duration jitter per item so a whole screen of tiles
    //doesn't wiggle in lockstep.
    const wigglePhase = useMemo(() => Math.random() * 300, [])
    const wiggleRotation = useSharedValue(0)
    useEffect(() => {
        if (props.isEditMode && !isDragging) {
            wiggleRotation.value = withDelay(wigglePhase, withRepeat(
                withSequence(
                    withTiming(-1.5, {duration: 120}),
                    withTiming(1.5, {duration: 240}),
                    withTiming(0, {duration: 120}),
                ),
                -1,
                true
            ))
        } else {
            wiggleRotation.value = withTiming(0, {duration: 100})
        }
    }, [props.isEditMode, isDragging])
    const wiggleStyle = useAnimatedStyle(() => ({
        transform: [{rotate: `${wiggleRotation.value}deg`}] as any,
    }))

    const wrapperViewStyle = useAnimatedStyle(() => ({
        position: "absolute",
        left: itemX.value + (isResizing.value ? resizeLeft.value : 0),
        top: itemY.value + (isResizing.value ? resizeTop.value : 0),
        transform: [
            {translateX: isDragging ? translateX.value : 0},
            {translateY: isDragging ? translateY.value : 0},
        ] as any,
        width: itemWidth.value * (isDragging ? n : 1) + (isResizing.value ? resizeRight.value - resizeLeft.value : 0),
        height: itemHeight.value * (isDragging ? n : 1) + (isResizing.value ? resizeBottom.value - resizeTop.value : 0),
        zIndex: isDragging ? 11 : 1,
    }), [itemX, itemY, itemHeight, itemWidth, translateX, translateY, isDragging, isResizing.value]);

    useAnimatedReaction(() => ({layout}),
        (c, p) => {
            if (JSON.stringify(c) !== JSON.stringify(p)) {
                console.log(c, p)
                runOnJS(setDragging)(false)
                isResizing.value = false
                resizeLeft.value = 0
                resizeRight.value = 0
                resizeTop.value = 0
                resizeBottom.value = 0
            }
        }, [layout])

    return <Animated.View
        style={wrapperViewStyle}
    >
        <GestureDetector gesture={compoundGesture}>
            <Animated.View
                style={[{
                    width: '100%', height: '100%',
                    justifyContent: 'center', alignItems: 'center'
                }, wiggleStyle]}>
                {props.children}
                <View style={{
                    position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
                    opacity: (props.isEditMode && !isDragging) ? 1 : 0
                }} pointerEvents={(props.isEditMode && !isDragging) ? "auto" : "none"}>
                    <DragPoint position={"right"} onResizeEnd={onResizeEnd} onResizeUpdate={onResizeUpdate}/>
                    <DragPoint position={"bottom"} onResizeEnd={onResizeEnd} onResizeUpdate={onResizeUpdate}/>
                    <DragPoint position={"top"} onResizeEnd={onResizeEnd} onResizeUpdate={onResizeUpdate}/>
                    <DragPoint position={"left"} onResizeEnd={onResizeEnd} onResizeUpdate={onResizeUpdate}/>
                    {props.onRemove && <RemoveBadge onPress={props.onRemove}/>}
                </View>
            </Animated.View>
        </GestureDetector>
    </Animated.View>;
}