import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { globalStyles } from '../constants/global'

type TitleDisplayProps = {
    text: string,
    secondaryText?: string,
    height?: number
}
const TitleDisplay = ({ text, secondaryText, height }: TitleDisplayProps) => {
    const h = (height) ? height : 150

    return (
        <View style={[styles.container, { height: h }]}>
            <Text style={globalStyles.title}>{text}</Text>
            {(secondaryText)
                ? <Text style={globalStyles.secondaryTitle}>{secondaryText}</Text>
                : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    }
})

export default TitleDisplay