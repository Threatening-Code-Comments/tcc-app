import FontAwesome from '@expo/vector-icons/FontAwesome'
import React from 'react'

export type IconName = keyof typeof FontAwesome.glyphMap
type IconProps = {
    iconName: IconName,
    iconSize?: number
}
export const Icon = ({ iconName, iconSize = 32 }: IconProps) => {
    return (
        <FontAwesome
            name={iconName}
            size={iconSize}
            color='white'
            style={{ width: iconSize, height: iconSize, alignSelf: 'center', marginRight: -5 }} />
    )
}