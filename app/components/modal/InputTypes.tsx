import { Picker } from '@react-native-picker/picker'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import React, { useState } from 'react'
import { Text, View } from 'react-native'
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated'
import { TextField } from 'rn-material-ui-textfield'
import { colors } from '../../constants/global'
import { Icon } from '../Icon'
import { IconButton, IconName } from '../IconButton'
import { modalStyles } from './ModalStyles'
import { ModalInputChangeType, UseModalNumberType, UseModalSelectType, UseModalStringType } from './ModalTypeDefs'

const inputMarginTop = -20

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
            marginTop: inputMarginTop,
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
                    tintColor={colors.primary}
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
    onFocus?: () => void
    onBlur?: () => void
}
export const NumberInput = ({ label, onInputChange, input, keyProp: key, onFocus: onFocusP = () => { }, onBlur: onBlurP = () => { } }: NumberInputProps) => {
    const [nums, setNums] = useState(input.value)
    const [isFocused, setIsFocused] = useState(false)

    const onChangeText = (num: number) => {
        setNums(num)
        onInputChange(key, num)
    }
    const progress = useDerivedValue(() => {
        console.log("setting progress to: ", isFocused ? 2 : 0, ", isFocused: ", isFocused, ", label: ", label)
        return withTiming((isFocused === true) ? 2 : 0)
    })

    const onFocus = () => {
        setIsFocused(true)
        onFocusP()
    }
    const onBlur = () => {
        setIsFocused(false)
        onBlurP()
    }

    const iconColor = interpolateColor(progress.value, [0, 2], ['#ffffff', colors.primary], 'RGB', { gamma: 2 })

    return (
        <View style={{
            marginTop: inputMarginTop,
            display: 'flex', flexDirection: 'row',
            alignContent: 'flex-start', justifyContent: 'flex-start', alignItems: 'flex-start', width: '100%',
        }}>
            <Animated.View style={{ flexShrink: 1, alignSelf: 'flex-start', marginTop: 35, paddingRight: 12, }}>
                {/* <Animated.View style={{ height: 24, width: 24, ...animatedStyle, }} /> */}
                {/* <Icon iconName='hashtag' iconSize={24} color={iconColor} /> */}
                <FontAwesome
                    name={"hashtag"}
                    size={24}
                    // iconStyle={style}
                    // color={color}
                    style={{ width: 24, height: 24, alignSelf: 'center', marginRight: -5, color: iconColor }} />
            </Animated.View>
            <Animated.View style={{ flexGrow: 10, }}>
                <TextField
                    label={label}
                    labelColor="#000000"
                    textColor="#ffffff"
                    tintColor={colors.primary}
                    baseColor="#ffffff"
                    onFocus={onFocus}
                    onBlur={onBlur}
                    keyboardType='numeric'
                    value={nums}
                    labelFontSize={16}
                    activeLineWidth={1}
                    onChangeText={(text) => onChangeText(text)}
                />
            </Animated.View>
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