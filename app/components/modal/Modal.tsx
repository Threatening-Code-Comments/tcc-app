import FontAwesome from '@expo/vector-icons/FontAwesome'
import React, { useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { ButtonInput, DropdownInput, NumberInput, TextInput } from './InputTypes'
import { modalStyles } from './ModalStyles'
import { ModalInputChangeType, UseModalInputType2, UseModalInputType3, UseModalOutputType, UseModalProps, UseModalReturn, UseModalStateType } from './ModalTypeDefs'

export function useModal<TTypes extends UseModalInputType2 = UseModalProps<any> extends UseModalProps<infer TInfer> ? TInfer : never>({
    title,
    inputTypes
}: UseModalProps<TTypes>): UseModalReturn<TTypes> {

    const defaultState = Object.keys(inputTypes).reduce((prev, key) => {
        const newInputStates = { ...prev };
        const input = inputTypes[key]
        if (input.type === "number")
            return { ...newInputStates, [key]: 0 };
        return { ...newInputStates, [key]: "" };
    }, {} as UseModalStateType<TTypes>)

    const [visible, setVisible] = useState(false)
    const [inputStates, setInputStates] = useState<UseModalStateType<TTypes>>(defaultState)

    const onClose = () => {
        setVisible(false)
    }

    const onInputChange = <TType extends UseModalInputType3, TKey extends keyof TTypes, TValue extends UseModalOutputType<TType>> (key: TKey, value: TValue) => {
        const newInputStates: UseModalStateType<TTypes> = {
            ...inputStates,
            [key]: value
        }
        setInputStates(newInputStates)
    }

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

                    {Object.keys(inputTypes).map(key => {
                        const input = inputTypes[key]
                        switch (input.type) {
                            case "string":
                                return (
                                    <TextInput key={key} label={key} onInputChange={onInputChange} input={input} />
                                )
                            case "number":
                                return (
                                    <NumberInput key={key} label={key} onInputChange={onInputChange} input={input} />
                                )
                            case "select":
                                return (
                                    <DropdownInput key={key} label={key} onInputChange={onInputChange} input={input} />
                                )
                            case "button":
                                return (
                                    <ButtonInput key={key} label={key} icon={input.icon} onClick={input.onClick} />
                                )
                        }
                    })}

                </View>
            </View>
        </Modal>
    )

    return {
        visible,
        setVisible,
        inputStates,
        component,
    }
}