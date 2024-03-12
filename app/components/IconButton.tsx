import FontAwesome from '@expo/vector-icons/FontAwesome'
import React from 'react'
import { Animated, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native'
import { ButtonType, colors, globalStyles } from '../constants/global'

export type IconName = keyof typeof FontAwesome.glyphMap
type IconButtonProps = {
    iconName: IconName,
    text?: string,
    style?: StyleProp<ViewStyle>,
    onPress?: () => void,
    type?: ButtonType
}
export const IconButton = ({ iconName, text, style, onPress, type }: IconButtonProps) => {
    const iconSize = 32

    const buttonType = (type) ? type : "primary"
    const color = colors[buttonType]

    return (
        <Animated.View style={{...styles.buttonContainer,}}>
            <Pressable style={[style, styles.button, { backgroundColor: color, }]} onPress={onPress} android_ripple={{ color: 'black', foreground: true }}>
                <FontAwesome name={iconName} size={iconSize} color='white' style={{ width: iconSize, height: iconSize, alignSelf: 'center', marginRight: -5 }} />
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