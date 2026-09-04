import {useAnimatedStyle, useSharedValue} from "react-native-reanimated";
import {Gesture} from "react-native-gesture-handler";
import {HomescreenState} from "@components/homescreen/types";

/**
 * Browsing vs. editing (drag/resize enabled). A long press on empty canvas toggles it,
 * with a tinted background while in edit mode. Doesn't know about drag/drop itself —
 * just whether it's currently allowed.
 */
export function useHomescreenEditMode() {
    const homescreenState = useSharedValue<HomescreenState>("edit")

    const longTap = Gesture.LongPress()
        .onStart(() => {
            homescreenState.value =
                (homescreenState.value === "default")
                    ? "edit"
                    : "default"
        })

    const editBackgroundStyle = useAnimatedStyle(() => ({
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor:
            (homescreenState.value === "default")
                ? 'transparent'
                : 'rgba(163,102,163,0.44)',
        zIndex: 1
    }), [homescreenState.value]);

    return {homescreenState, longTap, editBackgroundStyle}
}
