import FontAwesome from '@expo/vector-icons/FontAwesome'
import React, { useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { ButtonInput, DropdownInput, NumberInput, TextInput } from './InputTypes'
import { modalStyles } from './ModalStyles'
import { InputStateType, OnInputChangeType, UseModalProps } from './ModalTypeDefs'

export function useModal<const TProps extends UseModalProps>({
    title,
    inputTypes
}: TProps) {

    const defaultState = Object.keys(inputTypes).reduce((prev, key) => {
        const addToInputStates = <
            const TKey extends keyof typeof inputTypes,
            const TType extends (typeof inputTypes)[TKey] & { key: TKey },
            const TValue extends TType["type"] extends "number" ? number : string
        >(currentInputStates: InputStateType<typeof inputTypes>, key: TType, value: TValue) => {
            // @ts-ignore
            const newInputStates: InputStateType<typeof inputTypes> = {
                ...currentInputStates,
                [key.key]: value
            }
            return newInputStates
        }

        const input = inputTypes[key]
        if (input.type === "number")
            return addToInputStates(prev, { ...input, key: key }, 0)
        else
            return addToInputStates(prev, { ...input, key: key }, "")
    }, {} as InputStateType<typeof inputTypes>)

    const [visible, setVisible] = useState(false)
    const [inputStates, setInputStates] = useState<InputStateType<typeof inputTypes>>(defaultState)

    const onClose = () => {
        setVisible(false)
    }

    const onInputChange: OnInputChangeType = (key, value) => {
        // @ts-ignore
        const newInputStates: InputStateType<typeof inputTypes> = {
            ...inputStates,
            [key.key]: value
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
                        style={{flex: 1}}
                        color='white'
                        backgroundColor={"transparent"}
                        iconStyle={{ marginRight: 0 }}
                        name={"close"}
                        onPress={onClose}
                        size={15} />
                </View>
                <View style={{...modalStyles.content, /*padding: 20*/}}>
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
                                    <DropdownInput key={key} label={key} onInputChange={onInputChange} inputStates={inputStates} input={input} />
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
        inputTypes,
        component,
    } as const
}