import React, { useEffect } from 'react'
import { GridPoint, HomescreenItem, PixelItem } from './types'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

type PreviewItemProps = PixelItem
export const PreviewItem = (props: PreviewItemProps) => {
    useEffect(() => { }, [props])
    const itemX = useSharedValue<number>(props.x);
    const itemY = useSharedValue<number>(props.y);
    const itemWidth = useSharedValue<number>(props.width);
    const itemHeight = useSharedValue<number>(props.height);

    const animatedStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        left: itemX.value,
        top: itemY.value,
        width: itemWidth.value,
        height: itemHeight.value,
        opacity: 0.5,
        backgroundColor: 'transparent',
    }))
    return (
        <Animated.View style={animatedStyle}>
            {/* <View style={{margin: 10, backgroundColor: 'yellow', flexGrow: 1}} /> */}
            <View style={{ margin: 5, borderColor: '#4A90E2', borderWidth: 2, flexGrow: 1 }} />
        </Animated.View>
    )
}
