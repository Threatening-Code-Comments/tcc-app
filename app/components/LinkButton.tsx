import { Link } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

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