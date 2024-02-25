import { Picker } from '@react-native-picker/picker'
import React from 'react'
import { Text, View } from 'react-native'
import { IconButton, IconName } from '../IconButton'
import { OutlineTextField } from '../TextFields'
import { modalStyles } from './ModalStyles'
import { InputStateType, InputTypesType, OnInputChangeType } from './ModalTypeDefs'

type InputProps = {
    label: string,
    onInputChange: OnInputChangeType,
}

type TextInputProps = {
    input: { type: "string"; },
} & InputProps
export const TextInput = ({ label, onInputChange, input }: TextInputProps) => {
    return (
        <OutlineTextField
            style={modalStyles.materialInput}
            label={label}
            onChangeText={(text) => {
                onInputChange({ ...input, key: label }, text)
            }}
        />
    )
}

type NumberInputProps = {
    input: { type: "number"; },
} & InputProps
export const NumberInput = ({ label, onInputChange, input }: NumberInputProps) => {
    return (
        <OutlineTextField
            style={modalStyles.materialInput}
            label={label}
            keyboardType='numeric'
            onChangeText={(text) => {
                // @ts-ignore
                onInputChange({ ...input, key: label }, Number(text.replace(/[^0-9]/g, '')))
            }}
        />
    )
}

type DropdownInputProps = {
    input: { type: "select"; options: readonly string[]; },
    inputStates: InputStateType<InputTypesType>
} & InputProps
export const DropdownInput = ({ label, onInputChange, inputStates, input }: DropdownInputProps) => {
    return (
        <View>
            <Text>{label}:</Text>
            <Picker<string>
                style={modalStyles.picker}
                selectedValue={inputStates[label] as string}
                onValueChange={(itemValue, itemIndex) => onInputChange({ ...input, key: label }, itemValue)}
            >
                {
                    input.options.map(option => <Picker.Item key={`${label}${option}`} label={option} value={option} />)
                }
            </Picker>
        </View>
    )
}

type ButtonInputTypes = {
    label: string,
    icon: IconName,
    onClick: () => void
}
export const ButtonInput = ({ label, icon, onClick }: ButtonInputTypes) => {
    return (
        <View style={{borderRadius: 10}}>
            <IconButton
                style={{ alignSelf: 'center', }}
                text={label}
                iconName={icon}
                onPress={onClick}
            />
        </View>
    )
}