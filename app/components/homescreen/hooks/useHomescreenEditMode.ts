import {useSharedValue} from "react-native-reanimated";
import {Gesture} from "react-native-gesture-handler";
import {HomescreenState} from "@homescreen/types";

/**
 * Browsing vs. editing (drag/resize enabled). A long press on empty canvas toggles it.
 * Signaled to the user via the dot-grid background appearing and the tiles wiggling
 * (see MovableItem) rather than a screen-wide tint. Doesn't know about drag/drop itself —
 * just whether it's currently allowed.
 */
export function useHomescreenEditMode() {
    const homescreenState = useSharedValue<HomescreenState>("default")

    const longTap = Gesture.LongPress()
        .onStart(() => {
            homescreenState.value =
                (homescreenState.value === "default")
                    ? "edit"
                    : "default"
        })

    return {homescreenState, longTap}
}
