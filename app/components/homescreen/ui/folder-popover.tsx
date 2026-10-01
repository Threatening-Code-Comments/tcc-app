import Animated, {SharedValue, useAnimatedReaction, useAnimatedStyle, useDerivedValue} from "react-native-reanimated";
import {View} from "react-native";
import React from "react";
import {GRID_UNIT} from "@components/homescreen/move_algo";
import {DragState, HS3Element, PixelPoint} from "@components/homescreen/types";
import {Icon} from "@components/Icon";

type PointAlignment = "outside" | "in_left" | "in_right";
export type FolderOperations = "moveTo" | "create"

const POPOVER_WIDTH = 120
const POPOVER_HEIGHT = 45;
const POPOVER_PADDING = 10
//"transparent" processes to the color 0, which the animated style doesn't push to the native
//view — an area that was green then just stays green. A fully transparent green is non-zero.
const AREA_INACTIVE_COLOR = "rgba(0, 128, 0, 0)"
const getOperationAreasHeightWorklet = (element: HS3Element) => {
    "worklet"
    return element.layout.height * GRID_UNIT * 1.3
}

//where the popover sits for a folder target: centred just above it
export function getFolderPopoverOrigin(target: HS3Element): PixelPoint {
    "worklet"
    const {layout: {x, y, width}} = target
    return {
        y: -50 + y * GRID_UNIT,
        x: (GRID_UNIT - POPOVER_WIDTH) / 2 + x * GRID_UNIT +
            ((width > 1) ? (width / 4 * GRID_UNIT) : 0),
    }
}

//the two hover areas below the popover buttons (left = create folder, right = move into)
function getOperationAreasBounds(target: HS3Element) {
    "worklet"
    const pC = getFolderPopoverOrigin(target)
    return {
        xFrom: pC.x,
        yFrom: pC.y + POPOVER_HEIGHT,
        xTo: pC.x + POPOVER_WIDTH,
        yTo: pC.y + POPOVER_HEIGHT + getOperationAreasHeightWorklet(target),
    }
}

/**
 * Whether the cursor is anywhere on a folder target's popover — its button row or the hover
 * areas below. While it is, the folder stays the drop target even outside the folder's own
 * centre region, otherwise the (wider) areas could barely be reached.
 */
export function isInFolderPopover(target: HS3Element, cursor: PixelPoint): boolean {
    "worklet"
    const pC = getFolderPopoverOrigin(target)
    const areas = getOperationAreasBounds(target)
    return cursor.x >= pC.x - POPOVER_PADDING && cursor.x <= pC.x + POPOVER_WIDTH + POPOVER_PADDING
        && cursor.y >= pC.y && cursor.y <= areas.yTo
}

type Props = {
    //the current folder/item drop target (see useHomescreenDragAndDrop) — the popover only
    //shows for folder targets
    dropTarget: SharedValue<{ element: HS3Element } | undefined>;
    dragState: SharedValue<DragState | undefined>;
    //a worklet: called on the UI thread whenever the hovered half changes
    onOperationChange: (operation: FolderOperations) => void
}

/**
 * The "create folder | move into folder" choice shown above a hovered folder. Lives entirely
 * on the UI thread: it's always mounted, and whether it shows, where, and which half is
 * hovered all follow the shared drag values directly — no React re-render involved, so it
 * appears the moment a folder becomes the target and keeps up with the finger.
 */
export const FolderPopover = (props: Props) => {
    const {dropTarget, dragState, onOperationChange} = props;

    const target = useDerivedValue<HS3Element | undefined>(() => {
        const element = dropTarget.value?.element
        return (element && "folderId" in element) ? element : undefined
    }, [dropTarget]);

    const dragStateStatus = useDerivedValue<PointAlignment | undefined>(() => {
        const t = target.value
        const state = dragState.value
        if (!t || !state) return undefined;

        const cursor = state.coordinate
        const bounds = getOperationAreasBounds(t)
        if (bounds.xFrom <= cursor.x && cursor.x <= bounds.xTo &&
            bounds.yFrom <= cursor.y && cursor.y <= bounds.yTo) {
            return (cursor.x <= bounds.xFrom + POPOVER_WIDTH / 2) ? "in_left" : "in_right"
        }
        return "outside"
    }, [target, dragState]);

    useAnimatedReaction(
        () => dragStateStatus.value,
        (current, prev) => {
            if (current !== prev) {
                //leaving the left area (to "outside", or off the target entirely) falls back to
                //the default "moveTo" — otherwise "create" would stay active while nothing is
                //highlighted anymore, and even carry over to the next hovered folder
                onOperationChange((current === "in_left") ? "create" : "moveTo")
            }
        }, [dragStateStatus]
    )

    const shared = ({
        borderRadius: 12,
        justifyContent: 'center' as const,
        elevation: 8,
        shadowColor: 'black'
    })

    //The shared values are read in each useAnimatedStyle itself and handed to the helpers:
    //Reanimated only tracks shared values found in a style's own closure, so reading them
    //inside a helper left the styles stuck on whatever was hovered at the last React render.
    const buttonStyle = (half: PointAlignment, status: PointAlignment | undefined) => {
        "worklet"
        return (status === half)
            ? ({...shared, backgroundColor: "green", flex: 1.5, elevation: 18})
            : ({...shared, backgroundColor: "grey", flex: 1})
    }
    const leftButtonStyle = useAnimatedStyle(() => buttonStyle("in_left", dragStateStatus.value))
    const rightButtonStyle = useAnimatedStyle(() => buttonStyle("in_right", dragStateStatus.value))

    const popoverStyle = useAnimatedStyle(() => {
        const t = target.value
        if (!t) return ({
            backgroundColor: 'transparent',
            opacity: 0,
            position: 'absolute',
            top: 0, left: 0,
            width: 0, height: 0,
            elevation: 0,
            display: 'flex', flexDirection: 'row',
            overflow: 'hidden'
        })
        const pC = getFolderPopoverOrigin(t)
        return ({
            backgroundColor: '#00000000',
            opacity: 1,
            width: POPOVER_WIDTH + 2 * POPOVER_PADDING, height: POPOVER_HEIGHT + 2 * POPOVER_PADDING,
            padding: POPOVER_PADDING,
            position: 'absolute',
            top: pC.y,
            left: pC.x,
            zIndex: 20,
            display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
            overflow: 'visible'
        })
    })

    const areaStyle = (half: PointAlignment, t: HS3Element | undefined, status: PointAlignment | undefined) => {
        "worklet"
        if (!t) return ({
            position: 'absolute' as const, opacity: 0, top: 0, left: 0, zIndex: 20,
            backgroundColor: AREA_INACTIVE_COLOR, height: 0, width: 0
        })
        return ({
            position: 'absolute' as const,
            opacity: 0.5,
            top: POPOVER_HEIGHT + POPOVER_PADDING,
            left: half === "in_left" ? 0 : POPOVER_WIDTH / 2,
            zIndex: 20,
            backgroundColor: (status === half ? "green" : AREA_INACTIVE_COLOR),
            height: getOperationAreasHeightWorklet(t),
            width: POPOVER_WIDTH / 2
        })
    }
    const leftOperationAreaStyle = useAnimatedStyle(() => areaStyle("in_left", target.value, dragStateStatus.value))
    const rightOperationAreaStyle = useAnimatedStyle(() => areaStyle("in_right", target.value, dragStateStatus.value))

    return (
        <Animated.View style={popoverStyle} pointerEvents="none">
            <>
                <Animated.View style={leftOperationAreaStyle}>
                    <View style={{
                        height: '100%',
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "flex-end",
                        flexDirection: "column"
                    }}>
                        <Icon iconName={"createFolder"} color={"white"}/>
                    </View>
                </Animated.View>
                <Animated.View style={rightOperationAreaStyle}>
                    <View style={{
                        height: '100%',
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "flex-end",
                        flexDirection: "column"
                    }}>
                        <Icon iconName={"moveToFolder"} color={"white"}/>
                    </View>
                </Animated.View>
            </>

            <Animated.View style={leftButtonStyle}>
                <Icon iconName={"createFolder"} color={"white"}/>
            </Animated.View>
            <Animated.View style={rightButtonStyle}>
                <Icon iconName={"moveToFolder"} color={"white"}/>
            </Animated.View>
        </Animated.View>)
}
