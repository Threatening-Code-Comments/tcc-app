import React, {useEffect} from "react";
import {HS3Element} from "@homescreen/types";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from "react-native-reanimated";
import {GRID_UNIT} from "@homescreen/move_algo";
import {Text} from "react-native-paper";

const SHAKE_OFFSET = 5;

export type PreviewItemProps = {
    element?: HS3Element;
    impossible?: boolean;
    isDragElement?: boolean
    isCreateElement?: boolean
}

// type AnimatedPropsPreviewItem = Partial<PreviewItemProps>;
export const PreviewItem3 = (props: PreviewItemProps) => {
    const {element, impossible, isDragElement = false} = props;

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
    useEffect(() => {
        if (impossible)
            impossibleAnimation();
        else
            yShakeEffect()
    }, [props])

    const itemStyle = useAnimatedStyle(() => ({
        position: "absolute",
        left: x * GRID_UNIT,
        top: y * GRID_UNIT,
        width: width * GRID_UNIT,
        height: height * GRID_UNIT,
        backgroundColor: (impossible) ? "#ff000040" : "transparent",
        borderColor: (isDragElement) ? "purple" : (impossible) ? "red" : "black",
        borderWidth: 2,
        borderRadius: 4,
        transform: [
            {translateY: translationYShakeOffset.value},
            {translateX: translationXShakeOffset.value}
        ] as any,
        zIndex: 10,
        justifyContent: "center",
    }))
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
        {props.isCreateElement &&
            <Text style={{color: 'black', alignSelf: 'center', justifyContent: 'center',}}>{props.element.name}</Text>}
    </Animated.View>)
}

// export const AnimatedPreviewItem = Animated.createAnimatedComponent(PreviewItem3)