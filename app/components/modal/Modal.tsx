import FontAwesome from '@expo/vector-icons/FontAwesome'
import React, { useEffect, useState, } from 'react'
import { Dimensions, FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { ButtonInput, DropdownInput, NumberInput, TextInput } from './InputTypes'
import { modalStyles } from './ModalStyles'
import { ModalInputChangeType, UseModalErrorType, UseModalInputType2, UseModalInputType3, UseModalOutputType, UseModalProps, UseModalReturn, UseModalStateType } from './ModalTypeDefs'
import { useNavigation } from 'expo-router'
import { useKeyboardVisible } from '../hooks/keyboardIsOpened'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useSharedValue } from 'react-native-reanimated'

export function useModal<TTypes extends UseModalInputType2 = UseModalProps<any> extends UseModalProps<infer TInfer> ? TInfer : never>({
    title,
    inputTypes
}: UseModalProps<TTypes>): UseModalReturn<TTypes> {
    //TODO add back button support
    const defaultState = Object.keys(inputTypes).reduce((prev, key) => {
        const newInputStates = { ...prev };
        const input = inputTypes[key]
        if (input.type === "number")
            return { ...newInputStates, [key]: input.value ?? 0 };
        if (input.type === "string" || input.type === "select")
            return { ...newInputStates, [key]: input.value ?? "" };
        return newInputStates
    }, {} as UseModalStateType<TTypes>)

    const [visible, setVisible] = useState(false)
    const [inputStates, setInputStates] = useState<UseModalStateType<TTypes>>(defaultState)

    const errors = Object.keys(inputStates).reduce((prev, key: keyof TTypes) => {
        // @ts-ignore
        const value = inputStates[key]
        const inputType = inputTypes[key].type
        switch (inputType) {
            case "string":
                return { ...prev, [key]: (value as string).length === 0 };
            case "number":
                return { ...prev, [key]: value.toString().length === 0 };
            case "select":
                return { ...prev, [key]: (value as string).length === 0 };
            default:
                return { ...prev, [key]: false };
        }
    }, {} as UseModalErrorType<TTypes>)

    const onClose = () => {
        setVisible(false)
    }

    const onInputChange = <TType extends UseModalInputType3, TKey extends keyof TTypes, TValue extends UseModalOutputType<TType>>(key: TKey, value: TValue) => {
        const newInputStates: UseModalStateType<TTypes> = {
            ...inputStates,
            [key]: value
        }
        setInputStates(newInputStates)
    }

    const onKeyboard = (visible: boolean) => {
        const contHeig = windowHeight * (visible ? 0.3:0.6)
        const padBot = (visible) ? 0 : 100

        if (contentHeight.value != contHeig)
            contentHeight.value = contHeig

        if (paddingBottomHeight.value != padBot)
            paddingBottomHeight.value = padBot
    }

    const keyboardIsVisible = useKeyboardVisible(
        // () => { }, () => { })
        () => onKeyboard(true), () => onKeyboard(false))
    const windowHeight = Dimensions.get('window').height
    // const getHeight = (keyboardClosedPercent: number, keyboardOpenPercent) => windowHeight * ((keyboardIsVisible) ? keyboardOpenPercent : keyboardClosedPercent)
    const contentHeight = useSharedValue(windowHeight * 0.6)
    const paddingBottomHeight = useSharedValue(100)
    const shadowOpacity = useSharedValue((Object.keys(inputTypes).length > 7) ? 1 : 0)

    const component = (
        <Modal animationType="slide" transparent={true} visible={visible}>
            <Pressable style={{ height: '100%' }} onPress={() => { setVisible(false) }} />
            <View style={modalStyles.modalContent}>
                <View style={modalStyles.titleContainer}>
                    <View style={{ flex: 1 }} />
                    <Text style={modalStyles.title}>{title}</Text>
                    <FontAwesome.Button
                        style={{ flex: 1 }}
                        color='white'
                        backgroundColor={"transparent"}
                        iconStyle={{ marginRight: 0 }}
                        name={"close"}
                        onPress={onClose}
                        size={15} />
                </View>
                <View style={{ ...modalStyles.content, /*padding: 20*/ }}>
                    {/* <Text>children here</Text> */}

                    {/* {Object.keys(inputTypes).map(key => {
                        const input = inputTypes[key]
                        switch (input.type) {
                            case "string":
                                return (
                                    <TextInput key={key} keyProp={key} label={key} onInputChange={onInputChange} input={input} />
                                )
                            case "number":
                                return (
                                    <NumberInput key={key} keyProp={key} label={key} onInputChange={onInputChange} input={input} />
                                )
                            case "select":
                                return (
                                    <DropdownInput key={key} keyProp={key} label={key} onInputChange={onInputChange} input={input} />
                                )
                            case "button":
                                return (
                                    <ButtonInput key={key} label={key} icon={input.icon} onClick={input.onClick} />
                                )
                            case "submit":
                                return (
                                    <ButtonInput key={key} label={key} icon={input.icon} onClick={() => input.onClick(inputStates)} disabled={Object.values(errors).some(v => v)} />
                                )
                        }
                    })} */}
                    <Animated.View style={{ maxHeight: contentHeight, }} >
                        <FlatList
                            style={{
                                flexGrow: 1, borderRadius: 40, overflow: 'hidden'
                            }}
                            onScroll={({ nativeEvent }) => {
                                shadowOpacity.value = 1 - perc(nativeEvent)
                            }}
                            data={Object.keys(inputTypes)}
                            contentContainerStyle={{ paddingHorizontal: 30 }}
                            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                            renderItem={({ item: key }) => {
                                const input = inputTypes[key]
                                switch (input.type) {
                                    case "string":
                                        return (
                                            <TextInput onFocus={()=>onKeyboard(true)} onBlur={()=>onKeyboard(false)} key={key} keyProp={key} label={key} onInputChange={onInputChange} input={input} />
                                        )
                                    case "number":
                                        return (
                                            <NumberInput key={key} keyProp={key} label={key} onInputChange={onInputChange} input={input} />
                                        )
                                    case "select":
                                        return (
                                            <DropdownInput key={key} keyProp={key} label={key} onInputChange={onInputChange} input={input} />
                                        )
                                    case "button":
                                        return (
                                            <ButtonInput key={key} label={key} icon={input.icon} onClick={input.onClick} />
                                        )
                                    // case "submit":
                                    //     return (
                                    //         <ButtonInput key={key} label={key} icon={input.icon} onClick={() => input.onClick(inputStates)} disabled={Object.values(errors).some(v => v)} />
                                    //     )
                                }
                            }}
                        />
                        <Animated.View style={{ opacity: shadowOpacity, height: '100%', width: '100%', position: 'absolute', left: 0, bottom: 0, borderRadius: 30, pointerEvents: 'none', zIndex: 2 }}>
                            <LinearGradient
                                style={{ height: '100%', width: '100%', position: 'absolute', left: 0, bottom: 0, borderRadius: 30, pointerEvents: 'none', zIndex: 2 }}
                                start={{ x: 0.5, y: 0.98 }}
                                end={{ x: 0.5, y: 1 }}
                                colors={['#00000000', '#000000FF']} />
                        </Animated.View>
                    </Animated.View>
                </View>
                <Animated.View style={{ height: 100, marginBottom: paddingBottomHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {Object.keys(inputTypes).map((key, i) => {
                        const input = inputTypes[key]
                        if (input.type === "submit")
                            return (
                                <ButtonInput key={i} label={key} icon={input.icon} onClick={() => input.onClick(inputStates)} disabled={Object.values(errors).some(v => v)} />
                            )
                    })}
                </Animated.View>
            </View>
        </Modal>
    )

    return {
        visible,
        setVisible,
        inputStates,
        component,
        errors
    }
}

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
}

const perc = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const perc = contentOffset.y / (contentSize.height - layoutMeasurement.height)
    return (perc > 1) ? 1 : perc
}