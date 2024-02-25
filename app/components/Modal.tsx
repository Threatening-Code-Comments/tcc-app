import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Picker } from '@react-native-picker/picker'
import React, { useState } from 'react'
import { Modal, StyleSheet, Text, View } from 'react-native'
import { OutlineTextField } from '../components/TextFields'


type UseModalInputType = {
    type: "string"
} | {
    type: "number"
} | {
    type: "select"
    options: readonly string[]
}

type UseModalProps = {
    title: string
    inputTypes: Record<string, UseModalInputType>
}

type InputStateType<TProps extends Record<string, UseModalInputType>> = {
    [key in keyof TProps]: TProps[key]["type"] extends "number" ? number : string
}

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

    const onInputChange = <
        const TKey extends keyof typeof inputTypes,
        const TType extends (typeof inputTypes)[TKey] & { key: TKey },
        const TValue extends TType["type"] extends "number" ? number : string
    >(key: TType, value: TValue) => {
        // @ts-ignore
        const newInputStates: InputStateType<typeof inputTypes> = {
            ...inputStates,
            [key.key]: value
        }
        setInputStates(newInputStates)
    }

    const component = (
        <Modal animationType="slide" transparent={true} visible={visible}>
            <View style={modalStyles.modalContent}>
                <View style={modalStyles.titleContainer}>
                    <Text style={modalStyles.title}>{title}</Text>
                    <FontAwesome.Button
                        color='black'
                        backgroundColor={"transparent"}
                        iconStyle={{ marginRight: 0 }}
                        name={"close"}
                        onPress={onClose}
                        size={15} />
                </View>
                <View style={modalStyles.content}>
                    <Text>children here</Text>

                    {Object.keys(inputTypes).map(key => {
                        const input = inputTypes[key]
                        switch (input.type) {
                            case "string":
                                return (
                                    // <TextInput placeholder={key} style={styles.input} key={key} onChangeText={text => onInputChange({ ...input, key: key }, text)} />
                                    <OutlineTextField style={modalStyles.materialInput} key={key} label={key} onChangeText={(text) => { console.log(text); onInputChange({ ...input, key: key }, text) }} />
                                )
                            case "number":
                                return (
                                    // <TextInput placeholder={key} style={styles.input} key={key} keyboardType='numeric' onChangeText={text => onInputChange({ ...input, key: key }, Number(text.replace(/[^0-9]/g, '')))} />
                                    <OutlineTextField style={modalStyles.materialInput} key={key} label={key} keyboardType='numeric' onChangeText={(text) => { console.log(text); onInputChange({ ...input, key: key }, Number(text.replace(/[^0-9]/g, ''))) }} />
                                )
                            case "select":
                                return (
                                    <View key={key}>
                                        <Text>{key}:</Text>
                                        <Picker<string>
                                            style={modalStyles.picker}
                                            selectedValue={inputStates[key] as string}
                                            onValueChange={(itemValue, itemIndex) => onInputChange({ ...input, key: key }, itemValue)}
                                        >
                                            {
                                                input.options.map(option => <Picker.Item key={`${key}${option}`} label={option} value={option} />)
                                            }
                                        </Picker>
                                    </View>
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

const modalStyles = StyleSheet.create({
    modalContent: {
        height: "auto",
        minHeight: 400,
        width: '100%',
        backgroundColor: '#f1f1f1',
        borderTopRightRadius: 18,
        borderTopLeftRadius: 18,
        position: 'absolute',
        bottom: 0,
    },
    titleContainer: {
        height: 'auto',
        backgroundColor: '#e1e1e1',
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        paddingLeft: 20,
        paddingRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between',
        justifyContent: 'flex-end',
    },
    title: {
        color: '#000',
        width: '100%',
        fontSize: 16,
        textAlign: 'center',
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
    },
    materialInput: {
        margin: 12,
        borderRadius: 20,
    },
    picker: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
    },
    content: {
        padding: 10
    }
});