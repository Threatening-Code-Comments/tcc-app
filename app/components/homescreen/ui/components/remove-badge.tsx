import React from 'react';
import {View} from 'react-native';
import {Text} from 'react-native-paper';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';

const BADGE_SIZE = 22;

/**
 * The small red "×" in an element's top-left corner, shown while editing. A gesture-handler
 * Tap rather than a Pressable, so it wins against the drag gesture of whatever it sits on
 * (same reason DragPoint uses its own GestureDetector).
 */
//inset: sit inside the corner instead of overhanging it — for containers that clip
//(the App Drawer's ScrollView)
export const RemoveBadge = ({onPress, inset = false}: { onPress: () => void, inset?: boolean }) => {
    const tap = Gesture.Tap().onEnd(() => {
        runOnJS(onPress)()
    })

    return (
        <GestureDetector gesture={tap}>
            <View hitSlop={8} style={{
                position: 'absolute', left: 0, top: 0,
                margin: inset ? 4 : -BADGE_SIZE / 3,
                width: BADGE_SIZE, height: BADGE_SIZE, borderRadius: BADGE_SIZE / 2,
                backgroundColor: '#d32f2f',
                borderColor: 'white', borderWidth: 1.5,
                alignItems: 'center', justifyContent: 'center',
                zIndex: 30, elevation: 14,
            }}>
                <Text style={{color: 'white', fontSize: 14, lineHeight: 16, fontWeight: '700'}}>×</Text>
            </View>
        </GestureDetector>
    )
}
