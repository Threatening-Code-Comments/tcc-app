import { router } from 'expo-router'
import React from 'react'
import { Pressable, StyleProp, ViewStyle } from 'react-native'

type JLinkProps = {
    link: string,
    replace?: boolean,
    style?: StyleProp<ViewStyle>,
    children: React.ReactNode
}
const JLink = ({ link, style, children, replace }: JLinkProps) => {
    replace = (replace) ? replace : false

    return (
        <Pressable onPress={() => navigateToLink(link, replace)} style={style}>
            {children}
        </Pressable>
    )
}

const navigateToLink = (link: string, replace: boolean) => {
    if (!replace)
        router.push(link)
    else
        router.replace(link)
}

export default JLink