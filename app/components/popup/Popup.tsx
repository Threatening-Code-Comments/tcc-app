import React from 'react'
import { KeyboardAvoidingView, ModalProps, Pressable, Modal as RNModal, StyleSheet, View } from 'react-native'
import { Card, TextInput, Text } from 'react-native-paper'
import Animated from 'react-native-reanimated'
import { Icon } from '../Icon'
import { PopupElement } from './PopupTypeDefs'

type ModalCompProps = ModalProps & {
    isOpen: boolean,
    setModalOpen: (open: boolean) => void,
    content: PopupElement[],
    color?: string,
    transitionName?: string,
}
export function Popup({ isOpen, setModalOpen, color, content, transitionName, ...rest }: ModalCompProps) {
    const colorWithAlpha = color && (color.length === 7 ? color + "f0" : color.substring(0, 7) + "f0")
    const backgroundColor = color ? colorWithAlpha : "#f0f0f040"

    const hideModal = () => setModalOpen(false)

    return (<RNModal
        style={{ alignSelf: 'center' }}
        visible={isOpen}
        transparent
        animationType='fade'
        statusBarTranslucent
        {...rest}
    >
        <Pressable style={{ ...popupStyles.container }} onPress={hideModal}>
            <Card style={{ backgroundColor: backgroundColor, padding: 30 }}>
                <Pressable style={popupStyles.header} onPress={() => setModalOpen(false)}>
                    <View style={{ flexGrow: 1 }} />
                    <Icon iconName="close" iconSize={30} color={"white"} />
                </Pressable>
                <View style={{ ...popupStyles.content }}>
                    {content.map((element, index) => getViewForElement(element, index))}
                </View>
            </Card>
        </Pressable>
    </RNModal>)
}


const getViewForElement = (element: PopupElement, index: number) => {
    switch (element.type) {
        case 'textfield':
            return <TextInput key={index} label={element.label} value={element.value} onChangeText={element.onChange} />
        case 'numberfield':
            return <TextInput key={index} label={element.label} value={element.value.toString()} onChangeText={(value) => element.onChange(parseFloat(value))} />
        case 'button':
            return <Pressable key={index} onPress={element.onClick}><Text>{element.label}</Text></Pressable>
        default:
            break;
    }
}


const popupStyles = StyleSheet.create({
    container: {
        display: 'flex', flexDirection: 'column',
        alignSelf: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        padding: 20
    },
    header: {
        width: '100%',
        display: 'flex', flexDirection: 'row', alignItems: 'flex-start'
    },
    content: {
        alignItems: 'center', justifyContent: 'center'
    }
})