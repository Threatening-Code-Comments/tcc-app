import { Picker } from '@react-native-picker/picker'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { IconButton, IconName } from '../IconButton'
import { OutlineTextField } from '../TextFields'
import { modalStyles } from './ModalStyles'
import { TextField } from 'rn-material-ui-textfield'
import { ModalInputChangeType, UseModalNumberType, UseModalSelectType, UseModalStringType } from './ModalTypeDefs'
import { Icon } from '../Icon'

type InputProps = {
    label: string
}

type TextInputProps = {
    input: UseModalStringType
    keyProp: string
    onInputChange: ModalInputChangeType<"string", string>,
    onFocus?: () => void
    onBlur?: () => void
} & InputProps
export const TextInput = ({ label, onInputChange, keyProp: key, input, onFocus = () => { }, onBlur = () => { } }: TextInputProps) => {
    const [text, setText] = useState(input.value)

    const onChangeText = (text: string) => {
        setText(text)
        onInputChange(key, text)
    }

    return (
        <View style={{
            marginTop: -10,
            display: 'flex', flexDirection: 'row',
            alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%',
        }}>
            <View style={{ flexShrink: 1, alignSelf: 'flex-start', marginTop: 35, paddingRight: 12 }}>
                <Icon iconName='font' iconSize={24} />
            </View>
            <View style={{ flexGrow: 10, }}>
                <TextField
                    label={label}
                    labelColor="#000000"
                    textColor="#ffffff"
                    tintColor="#ffffff"
                    baseColor="#ffffff"
                    value={text}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    labelFontSize={16}
                    activeLineWidth={1}
                    onChangeText={(text) => onChangeText(text)}
                />
            </View>
        </View>
    )
}

type NumberInputProps = InputProps & {
    input: UseModalNumberType
    keyProp: string
    onInputChange: ModalInputChangeType<"number", string>
}
export const NumberInput = ({ label, onInputChange, input, keyProp: key }: NumberInputProps) => {
    const [nums, setNums] = useState(input.value)

    const onChangeText = (num: number) => {
        setNums(num)
        onInputChange(key, num)
    }

    return (
        <View style={{
            marginTop: -10,
            display: 'flex', flexDirection: 'row',
            alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%',
        }}>
            <View style={{ flexShrink: 1, alignSelf: 'flex-start', marginTop: 35, paddingRight: 12 }}>
                <Icon iconName='hashtag' iconSize={24} />
            </View>
            <View style={{ flexGrow: 10, }}>
                <TextField
                    label={label}
                    labelColor="#000000"
                    textColor="#ffffff"
                    tintColor="#ffffff"
                    baseColor="#ffffff"
                    keyboardType='numeric'
                    value={nums}
                    labelFontSize={16}
                    activeLineWidth={1}
                    onChangeText={(text) => onChangeText(text)}
                />
            </View>
        </View>
    )
}

// <OutlineTextField
//     style={{...modalStyles.materialInput, ...{}}}
//     label={label}
//     keyboardType='numeric'
//     onChangeText={(text) => {
//         onInputChange(key, Number(text.replace(/[^0-9]/g, '')))
//     }}
// />

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
    disabled?: boolean
}
export const ButtonInput = ({ label, icon, onClick, disabled }: ButtonInputTypes) => {
    return (
        <View style={{ borderRadius: 10, }}>
            <IconButton
                style={{ alignSelf: 'center', }}
                text={label}
                iconName={icon}
                onPress={onClick}
                disabled={disabled}
            />
        </View>
    )
}