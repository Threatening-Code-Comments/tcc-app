import Animated, {runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue} from "react-native-reanimated";
import {View} from "react-native";
import React from "react";
import {GRID_UNIT} from "@components/homescreen/move_algo";
import {DragState4} from "@components/homescreen/top-down-homescreen/model-and-crud/top-down-hs-types";
import {HS3Element, PixelPoint} from "@components/homescreen/types";
import {Icon} from "@components/Icon";

type PointAlignment = "outside" | "in_left" | "in_right";
export type FolderOperations = "moveTo" | "create"

const POPOVER_WIDTH = 120
const POPOVER_HEIGHT = 45;
const POPOVER_PADDING = 10
// const getOperationAreasHeight = (element: HS3Element) => element.layout.height * GRID_UNIT
const getOperationAreasHeightWorklet = (element: HS3Element) => {
    "worklet"
    return element.layout.height * GRID_UNIT * 1.3
}

type Props = {
    isAddFolder: HS3Element;
    dragState: DragState4;
    onOperationChange: (operation?: FolderOperations) => void
}
export const FolderPopover = (props: Props) => {

    const {isAddFolder, dragState} = props;

    const coordinate = useDerivedValue<PixelPoint>(() => {
        if (!isAddFolder || !dragState) {
            return undefined;
        }

        const {layout: {x, y, width}} = isAddFolder;

        return ({
            y: -50 + y * GRID_UNIT,
            x: (GRID_UNIT - 120) / 2 + x * GRID_UNIT +
                ((width > 1) ? (width / 4 * GRID_UNIT) : 0),
        })
    }, [isAddFolder, dragState]);

    const dragStateStatus = useDerivedValue<PointAlignment>(() => {
        if (!dragState || !coordinate.value) return undefined;

        //popover coordinate
        const pC = coordinate.value;
        const cursor = dragState.coordinate

        const bounds = {
            xFrom: pC.x,
            yFrom: pC.y + POPOVER_HEIGHT,
            xTo: pC.x + POPOVER_WIDTH,
            yTo: pC.y + POPOVER_HEIGHT + getOperationAreasHeightWorklet(dragState.element),
        }
        if (bounds.xFrom <= cursor.x && cursor.x <= bounds.xTo &&
            bounds.yFrom <= cursor.y && cursor.y <= bounds.yTo) {
            if (cursor.x <= pC.x + POPOVER_WIDTH / 2) {
                return "in_left"
            } else {
                return "in_right"
            }
        }

        return "outside"
    }, [dragState, coordinate]);

    const shared = ({
        borderRadius: 12,
        justifyContent: 'center',
        elevation: 8,
        shadowColor: 'black'
    })

    const leftButtonStyle = useAnimatedStyle(() => {
        if (!dragStateStatus.value) return ({})

        if (dragStateStatus.value != "in_left") return ({
            ...shared,
            backgroundColor: "grey",
            flex: 1
        })

        return ({
            ...shared,
            backgroundColor: "green",
            flex: 1.5,
            elevation: 18
        })
    }, [dragStateStatus])
    const rightButtonStyle = useAnimatedStyle(() => {
        if (!dragStateStatus.value) return ({})

        if (dragStateStatus.value != "in_right") return ({
            ...shared,
            backgroundColor: "grey",
            flex: 1
        })

        return ({
            ...shared,
            backgroundColor: "green",
            flex: 1.5,
            elevation: 18
        })
    }, [dragStateStatus])

    const createFolderPopoverStyle = useAnimatedStyle(() =>
        (!!isAddFolder && "folderId" in isAddFolder)
            ? ({
                backgroundColor: '#00000000',
                opacity: 1,
                width: POPOVER_WIDTH + 2 * POPOVER_PADDING, height: POPOVER_HEIGHT + 2 * POPOVER_PADDING,
                padding: POPOVER_PADDING,
                position: 'absolute',
                top: coordinate.value.y,
                left: coordinate.value.x,
                zIndex: 20,
                display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
                overflow: 'visible'
            }) : ({
                backgroundColor: 'transparent',
                opacity: 0,
                position: 'absolute',
                top: 0, left: 0,
                width: 0, height: 0,
                elevation: 0,
                display: 'flex', flexDirection: 'row',
                overflow: 'hidden'
            }), [isAddFolder, coordinate])
    const leftOperationAreaStyle = useAnimatedStyle(() => {
        if (!coordinate.value || !isAddFolder) return ({})

        return ({
            position: 'absolute',
            opacity: 0.5,
            top: POPOVER_HEIGHT + POPOVER_PADDING,
            left: 0,//coordinate.value.x,
            zIndex: 20,
            backgroundColor: (dragStateStatus.value == "in_left" ? "green" : 'transparent'),
            height: getOperationAreasHeightWorklet(isAddFolder),
            width: POPOVER_WIDTH / 2
        })
    }, [coordinate, dragStateStatus, dragState])
    const rightOperationAreaStyle = useAnimatedStyle(() => {
        if (!coordinate.value || !isAddFolder) return ({})

        return ({
            position: 'absolute',
            opacity: 0.5,
            top: POPOVER_HEIGHT + POPOVER_PADDING,
            left: POPOVER_WIDTH / 2,
            zIndex: 20,
            backgroundColor: (dragStateStatus.value == "in_right" ? "green" : 'transparent'),
            height: getOperationAreasHeightWorklet(isAddFolder),
            width: POPOVER_WIDTH / 2
        })
    }, [coordinate, dragStateStatus, dragState])

    useAnimatedReaction(
        () => dragStateStatus.value,
        (current, prev) => {
            if (current !== prev) {
                const alignment = (current === "outside") ? undefined : current
                if (!alignment) {
                    runOnJS(props.onOperationChange)(undefined)
                    return
                }

                const op: FolderOperations = (!!alignment && alignment === "in_left") ? "create" : "moveTo"
                runOnJS(props.onOperationChange)(op)
            }
        }, [dragState, dragStateStatus]
    )

    return (
        <Animated.View style={createFolderPopoverStyle}>
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