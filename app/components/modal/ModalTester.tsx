import React from 'react'
import { useModal } from './Modal';
import { View } from 'react-native';
import { IconButton } from '../IconButton';

const ModalTester = () => {
    const t1 = useModal<{
        "Page Name": "string"
        "Add": "submit"
    }>({
        title: "Add Page",
        inputTypes: {
            "Page Name": {
                type: "string"
            },
            "Add": {
                type: "submit",
                onClick: (data) => output(JSON.stringify(data, null, 3)),
                icon: 'plus'
            }
        }
    });

    const modal5 = useModal<{
        "Element 1": "string",
        "Element 2": "string",
        "Element 3": "string",
        "Element 4": "string",
        "Element 5": "string",
    }>({
        title: "Big Modal",
        inputTypes: {
            "Element 1": {
                type: "string"
            },
            "Element 2": {
                type: "string"
            },
            "Element 3": {
                type: "string"
            },
            "Element 4": {
                type: "string"
            },
            "Element 5": {
                type: "string"
            },
        }
    });

    const modal10 = useModal<{
        "Text 1": "string",
        "Text 2": "string",
        "Text 3": "string",
        "Text 4": "string",
        "Text 5": "string",
        "Number 1": "number",
        "Number 2": "number",
        "Number 3": "number",
        "Number 4": "number",
        "Number 5": "number",
        "Button 1": "submit",
        "Button 2": "submit",
        "Button 3": "submit",
        "Button 4": "submit",
        "Button 5": "submit",
    }>({
        title: "Modal with 10 Elements",
        inputTypes: {
            "Text 1": {
                type: "string"
            },
            "Text 2": {
                type: "string"
            },
            "Text 3": {
                type: "string"
            },
            "Text 4": {
                type: "string"
            },
            "Text 5": {
                type: "string"
            },
            "Number 1": {
                type: "number"
            },
            "Number 2": {
                type: "number"
            },
            "Number 3": {
                type: "number"
            },
            "Number 4": {
                type: "number"
            },
            "Number 5": {
                type: "number"
            },
            "Button 1": {
                type: "submit",
                onClick: (data) => output(JSON.stringify(data, null, 3)),
                icon: 'plus'
            },
            "Button 2": {
                type: "submit",
                onClick: (data) => output(JSON.stringify(data, null, 3)),
                icon: 'plus'
            },
            "Button 3": {
                type: "submit",
                onClick: (data) => output(JSON.stringify(data, null, 3)),
                icon: 'plus'
            },
            "Button 4": {
                type: "submit",
                onClick: (data) => output(JSON.stringify(data, null, 3)),
                icon: 'plus'
            },
            "Button 5": {
                type: "submit",
                onClick: (data) => output(JSON.stringify(data, null, 3)),
                icon: 'plus'
            },
        }
    });

    const components = [t1, modal5, modal10];

    return (
        <>
            {components.map((c, i) => <View key={i}>{c.component}</View>)}
            {components.map((c, i) => {
                return <IconButton key={i} iconName='edge' text={`T` + i + 1} onPress={() => { c.setVisible(true); console.log("onpress"); }} />
            })}
        </>
    )
}



function log(obj: any) {
    console.log(JSON.stringify(obj, null, 3))
}

function output(msg: string) {
    console.log(msg)
}

export default ModalTester