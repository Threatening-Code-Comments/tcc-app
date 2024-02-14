import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Page } from '../constants/DbTypes'
import { Link } from 'expo-router'

type LinkButtonProps = {
    link: string,
    text1: string | number,
    text2: string | number
}
export const LinkButton = (props: LinkButtonProps) => {
    return (
        <Link href={props.link}>
            <View style={styles.card}>
                <Text style={styles.id}>{props.text1}</Text>
                <Text style={styles.name}>{props.text2}</Text>
            </View>
        </Link>
    )
}

export default LinkButton

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'row',
        padding: 10,
        // borderColor: 'black',
        borderStyle: 'solid',
        borderWidth: 2,
        gap: 2,
        alignSelf: 'center',
    },
    id: {
        alignSelf: 'flex-start'
    },
    name: {
        alignSelf: 'flex-end'
    }
})