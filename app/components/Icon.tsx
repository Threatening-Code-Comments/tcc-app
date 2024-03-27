import FontAwesome from '@expo/vector-icons/FontAwesome'
import React, { useEffect } from 'react'
import { OpaqueColorValue } from 'react-native'
import Animated from 'react-native-reanimated'

export type IconName = keyof typeof FontAwesome.glyphMap
type IconProps = {
    iconName: IconName,
    iconSize?: number,
    color?: string | OpaqueColorValue
}
export const Icon = ({ iconName, iconSize = 32, color = '#ffffFf',  }: IconProps) => {
    // (color != 'white') ? console.log(color) : null

    return (
        <FontAwesome
            name={iconName}
            size={iconSize}
            // iconStyle={style}
            // color={color}
            style={{ width: iconSize, height: iconSize, alignSelf: 'center', marginRight: -5, color: color}} />
    )
}