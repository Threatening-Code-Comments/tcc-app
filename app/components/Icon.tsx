import FontAwesome from '@expo/vector-icons/FontAwesome'
import React, { forwardRef } from 'react'
import { OpaqueColorValue, StyleProp, View } from 'react-native'
import Animated from 'react-native-reanimated'

export type IconName = keyof typeof FontAwesome.glyphMap
type IconProps = {
    iconName: IconName,
    iconSize?: number,
    color?: string | OpaqueColorValue
    styles?: StyleProp<any>
}
const Icon = Animated.createAnimatedComponent(forwardRef<any, IconProps>(({ iconName, iconSize = 32, color = '#ffffFf', styles }, ref) => {
    // (color != 'white') ? console.log(color) : null

    return (
        <View style={{ display: 'flex', flexDirection: 'row', alignSelf: 'center', alignContent: 'center', justifyContent: 'center', alignItems: 'center', width: iconSize, height: iconSize }}>
            <FontAwesome
                ref={ref}
                name={iconName}
                size={iconSize}
                // iconStyle={style}
                // color={color}
                style={{
                    ...(styles ?? {}), width: '100%', height: '100%', alignSelf: 'center', justifyContent: 'center',
                    // borderColor: 'green', borderWidth: 2,
                    // marginRight: -5,
                    color: color
                }} />
        </View>
    )
}))

export { Icon }
