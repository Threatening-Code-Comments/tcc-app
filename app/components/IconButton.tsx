import FontAwesome from '@expo/vector-icons/FontAwesome'
import React from 'react'
import { ButtonType, colors } from '../constants/global'

type IconButtonProps = {
    iconName: keyof typeof FontAwesome.glyphMap,
    text?: string,
    onPress?: () => void,
    type?: ButtonType
}
export const IconButton = (props: IconButtonProps) => {
    const iconSize = 32
    const padding = 5
    const wH = iconSize + padding * 2
    const text = props.text

    const type = (props.type) ? props.type : "primary"
    const color = colors[type]

    return (
        <FontAwesome.Button
            style={{ alignSelf: 'center', margin: 5, }}
            color='white'
            backgroundColor={color}
            borderRadius={10}
            name={props.iconName}
            onPress={props.onPress}
            size={iconSize}>
            {(text) ? text : null}
        </FontAwesome.Button>

    )
}