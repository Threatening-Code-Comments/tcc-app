import { Picker } from '@react-native-picker/picker'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { IconButton, IconName } from '../IconButton'
import { OutlineTextField } from '../TextFields'
import { modalStyles } from './ModalStyles'
import { TextField } from 'rn-material-ui-textfield'
import { ModalInputChangeType, UseModalNumberType, UseModalSelectType, UseModalStringType } from './ModalTypeDefs'

type InputProps = {
    label: string
}

type TextInputProps = {
    input: UseModalStringType
    keyProp: string
    onInputChange: ModalInputChangeType<"string", string>
} & InputProps
export const TextInput = ({ label, onInputChange, keyProp: key, input }: TextInputProps) => {
    const [text, setText] = useState(input.value)

    const onChangeText = (text: string) => {
        setText(text)
        onInputChange(key, text)
    }

    return (
        <TextField
            label={label}
            style={modalStyles.materialInput}
            textColor="#ffffff"
            tintColor="#ffffff"
            baseColor="#ffffff"
            value={text}
            labelFontSize={16}
            activeLineWidth={1}
            onChangeText={(text) => onChangeText(text)}
        />
    )
}

type NumberInputProps = InputProps & {
    input: UseModalNumberType
    keyProp: string
    onInputChange: ModalInputChangeType<"number", string>
}
export const NumberInput = ({ label, onInputChange, input, keyProp: key }: NumberInputProps) => {
    return (
        <OutlineTextField
            style={modalStyles.materialInput}
            label={label}
            keyboardType='numeric'
            onChangeText={(text) => {
                onInputChange(key, Number(text.replace(/[^0-9]/g, '')))
            }}
        />
    )
}

type SelectInputProps = InputProps & {
    input: UseModalSelectType
    keyProp: string
    onInputChange: ModalInputChangeType<"select", string>
}
export const DropdownInput = ({ label, onInputChange, input, keyProp: key }: SelectInputProps) => {
    return (
        <View>
            <Text>{label}:</Text>
            <Picker<string>
                style={modalStyles.picker}
                selectedValue={input.options[label] as string}
                onValueChange={itemValue => onInputChange(key, itemValue)}
            >
                {
                    input.options.map(option => <Picker.Item key={`${label}${option}`} label={option} value={option} />)
                }
            </Picker>
        </View>
    )
}

type ButtonInputTypes = InputProps & {
    icon: IconName,
    onClick: () => void
}
export const ButtonInput = ({ label, icon, onClick }: ButtonInputTypes) => {
    return (
        <View style={{ borderRadius: 10, }}>
            <IconButton
                style={{ alignSelf: 'center', }}
                text={label}
                iconName={icon}
                onPress={onClick}
            />
        </View>
    )
}