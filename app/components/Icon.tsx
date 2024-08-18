import { IconName, iconNames } from '@app/constants/iconNames'
import React, { forwardRef } from 'react'
import { OpaqueColorValue, StyleProp, View } from 'react-native'
import { Icon as PaperIcon } from 'react-native-paper'
import Animated from 'react-native-reanimated'

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
            {/* <PaperIcon source={iconName} size={iconSize} /> */}
            <PaperIcon
                size={iconSize}
                source={iconNames[iconName]}
                color={color.toString()} />
        </View>
    )
}))

export { Icon }

// <FontAwesome
//     ref={ref}
//     name={iconName}
//     size={iconSize}
//     // iconStyle={style}
//     // color={color}
//     style={{
//         ...(styles ?? {}), width: '100%', height: '100%', alignSelf: 'center', justifyContent: 'center',
//         // borderColor: 'green', borderWidth: 2,
//         // marginRight: -5,
//         color: color
//     }} />