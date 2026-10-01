import React, {useEffect} from "react";
import {HS3Element} from "@homescreen/types";
import Animated, {
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";
import {GRID_UNIT} from "@homescreen/move_algo";
import {Text, useTheme} from "react-native-paper";
import {useHomescreenData} from "@components/homescreen/homescreen-data-context";

const SHAKE_OFFSET = 5;

export type PreviewItemProps = {
    element?: HS3Element;
    impossible?: boolean;
    isDragElement?: boolean
    isCreateElement?: boolean
    //when set, position and size follow this shared value on the UI thread instead of
    //`element.layout` — for the drag preview, so it keeps up with the finger without
    //waiting for a React re-render of the whole level
    layoutSource?: SharedValue<HS3Element | undefined>
    //when set and true, the preview is invisible (UI thread, no re-render needed)
    hiddenSource?: SharedValue<boolean>
}

// type AnimatedPropsPreviewItem = Partial<PreviewItemProps>;
export const PreviewItem = (props: PreviewItemProps) => {
    const {element, impossible, isDragElement = false, layoutSource, hiddenSource} = props;
    const {colors} = useTheme();
    const {tileById} = useHomescreenData();

    const tile = (element && "itemId" in element) ? tileById.get(element.tileId) : undefined
    const elementColor = element ? (("itemId" in element) ? tile?.color : element.color) : undefined
    const elementName = element ? (("itemId" in element) ? tile?.name : element.name) : undefined

    const {layout: {x, y, width, height}} = element ?? {layout: {x: 0, y: 0, width: 0, height: 0}};
    const translationYShakeOffset = useSharedValue<number>(0);
    const translationXShakeOffset = useSharedValue<number>(0);

    const impossibleAnimation = () => {
        translationYShakeOffset.value = 0
        translationXShakeOffset.value = withRepeat(
            withSequence(
                withTiming(SHAKE_OFFSET, {duration: 200}),
                withTiming(-SHAKE_OFFSET, {duration: 200}),
                withTiming(0, {duration: 500})
            ),
            -1,
            true
        )
        ;
    }
    //only when `impossible` flips — depending on the whole props object restarted both
    //looping animations on every single re-render
    useEffect(() => {
        if (impossible)
            impossibleAnimation();
        else
            yShakeEffect()
    }, [impossible])

    const itemStyle = useAnimatedStyle(() => {
        const live = layoutSource?.value?.layout
        const l = live ?? {x, y, width, height}
        return {
        opacity: hiddenSource?.value ? 0 : 1,
        position: "absolute",
        left: l.x * GRID_UNIT,
        top: l.y * GRID_UNIT,
        width: l.width * GRID_UNIT,
        height: l.height * GRID_UNIT,
        backgroundColor: (impossible) ? "#ff000040" : "transparent",
        borderColor: (isDragElement) ? "purple" : (impossible) ? "red" : (elementColor ?? "black"),
        borderWidth: 2,
        borderRadius: 4,
        transform: [
            {translateY: translationYShakeOffset.value},
            {translateX: translationXShakeOffset.value}
        ] as any,
        zIndex: 10,
        justifyContent: "center",
        }
    })
    const yShakeEffect = () => {
        translationXShakeOffset.value = 0
        translationYShakeOffset.value = withRepeat(
            withSequence(
                withTiming(SHAKE_OFFSET, {duration: 500}),
                withTiming(-SHAKE_OFFSET, {duration: 500})
            ),
            -1,
            true
        );
    }

    if (!props.element) {
        return null;
    }

    return (<Animated.View style={itemStyle}>
        {!isDragElement &&
            <Text style={{color: colors.onBackground, alignSelf: 'center', justifyContent: 'center',}}>
                {elementName}
            </Text>}
    </Animated.View>)
}

// export const AnimatedPreviewItem = Animated.createAnimatedComponent(PreviewItem)