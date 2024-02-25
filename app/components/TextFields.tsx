
import { OutlinedTextField } from 'rn-material-ui-textfield'

import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native';

type TextfieldProps = {
    style?: StyleProp<ViewStyle>,
    label: string,
    onChangeText: (text: string) => void,
    onSubmitEditing?: () => void,
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'visible-password' | 'ascii-capable' | 'numbers-and-punctuation' | 'url' | 'number-pad' | 'name-phone-pad' | 'decimal-pad' | 'twitter' | 'web-search' | undefined,
}


export const OutlineTextField = ({ label, onChangeText, onSubmitEditing, style, keyboardType }: TextfieldProps) => {
    const fieldRef = React.createRef<OutlinedTextField>();

    // const formatText = (text: string) => {
    //     return text.replace(/[^+\d]/g, '');
    // };

    return (
        <View style={style}>
            <OutlinedTextField
                label={label}
                keyboardType={(keyboardType)? keyboardType : 'default'}
                // formatText={formatText}
                onSubmitEditing={onSubmitEditing}
                onChangeText={onChangeText}
                ref={fieldRef}
            />
        </View>
    );
}
