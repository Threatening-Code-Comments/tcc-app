import React from 'react'
import { Pressable, StyleProp, View, ViewStyle } from 'react-native'
import { IconButton } from '../IconButton'
import JLink from '../JLink'

type LinkOrPressableProps = {
    isLink: boolean,
    link: string,
    onPress: () => void,
    replace?: boolean,
    style?: StyleProp<ViewStyle>,
    children: React.ReactNode,
}
export const LinkOrPressable = ({ isLink, link, onPress, replace, style, children }: LinkOrPressableProps) => {
    return (
        (isLink) ?
            <JLink link={link} replace={replace} style={style}>{children}</JLink> :
            <Pressable onPress={onPress} style={style}>{children}</Pressable>
    )
}


type DeleteButtonProps = {
    isEditMode: boolean,
    onPress: () => void
}
export const DeleteButton = ({ isEditMode, onPress }: DeleteButtonProps) => {
    if (!isEditMode) return <></>

    return (
        <View style={{ zIndex: 2, marginBottom: -50, width: '45%', height: 50, alignSelf: 'flex-end', }}>
            <IconButton
                iconName='times'
                type='error'
                onPress={onPress} />
        </View >)
}

export const getFlex = (numCols: number | undefined) => {
    return 1 / ((numCols) ? numCols : 2)
}