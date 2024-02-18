import { useRouter } from 'expo-router'
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
    const router = useRouter()

    const navigateToLink = (link: string, replace: boolean) => {
        if (!replace)
            router.push(link)
        else
            router.replace(link)
    }

    return (
        <Pressable onPress={() => navigateToLink(link, replace)} style={style}>
            {children}
        </Pressable>
    )
}

export default JLink