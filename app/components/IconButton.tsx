import FontAwesome from '@expo/vector-icons/FontAwesome'
import React from 'react'
import { Animated, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native'
import { ButtonType, colors, globalStyles } from '../constants/global'
import { Icon } from './Icon'

export type IconName = keyof typeof FontAwesome.glyphMap
type IconButtonProps = {
    iconName: IconName,
    text?: string,
    style?: StyleProp<ViewStyle>,
    onPress?: () => void,
    type?: ButtonType
    disabled?: boolean
}
export const IconButton = ({ iconName, text, style, onPress, type, disabled }: IconButtonProps) => {
    const buttonType = (type) ? type : "primary"
    const color = disabled ? "gray" : colors[buttonType]

    return (
        <Animated.View style={{ ...styles.buttonContainer, }}>
            <Pressable style={[style, styles.button, { backgroundColor: color, }]} disabled={disabled} onPress={onPress} android_ripple={{ color: 'black', foreground: true }}>
                <Icon iconName={iconName} iconSize={32} />
                {(text != undefined)
                    ? <Text style={globalStyles.text}>{text}</Text>
                    : null}
            </Pressable>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    buttonContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        alignContent: 'center',
    },
    button: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        padding: 10,
        paddingHorizontal: 12,
        gap: 10
    }
})