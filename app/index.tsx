import { ResultSet } from 'expo-sqlite'
import React, { ReactNode, useState } from 'react'
import { FlatList, LogBox, Modal, Text, View, StyleSheet, Pressable, TextInput } from 'react-native'
import { IconButton } from './components/IconButton'
import { PageTileComponent } from './components/Tiles'
import { Page } from './constants/DbTypes'
import { dropDb } from './db/database'
import { getPages, insertPages } from './db/pages'
import { Link } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Picker } from '@react-native-picker/picker'

const HomePage = () => {
    LogBox.ignoreLogs(['new NativeEventEmitter'])

    const [pages, setPages] = useState<Page[]>([])
    const [queried, setQueried] = useState(false)

    const { setVisible, component: AddPageModal, inputStates, inputTypes: outputTypes } = useModal({
        title: "Add Page",
        inputTypes: {
            "Page Name": {
                type: "string"
            },
            "Page Number": {
                type: "number"
            },
            "Page Type": {
                type: "select",
                options: ["Text", "Image", "Video"]
            }
        }
    } as const);

    const f = {
        "Page Name": {
            type: "string"
        },
        "Page Number": {
            type: "number"
        },
        "Page Type": {
            type: "select",
            options: ["Text", "Image", "Video"]
        }
    } as const

    type test = InputStateType<typeof f>
    type test3 = typeof outputTypes

    type test2 = typeof inputStates

    const addPage = () => {
        setVisible(true)
        // const randomNumber = Math.random()
        // const name = `Page |${randomNumber}|`

        // insertPages(
        //     [{ name: name }],
        //     (err, res) => {
        //         if (err) {
        //             console.error("Error inserting page: ", err)
        //         } else {
        //             console.info("Inserted page: ", res)
        //             setPages([...pages, { id: (res[0] as ResultSet).insertId, name: name }])
        //         }
        //     })
    }

    const query = () => {
        getPages((_err, res) => {
            if (res[0] != undefined)
                setPages(res)
        })
        setQueried(true)
    }

    // TODO zu useEffect machen
    if (!queried) {
        query()
    }

    const padding = 5
    return (
        <>
            <Text>HomePage</Text>

            <View style={{ margin: 10, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                <IconButton iconName='plus' text='Add' onPress={addPage} />
                <IconButton iconName='refresh' text='Refresh' onPress={query} />
                <IconButton iconName='trash' text='Drop DB' onPress={dropDb} />
            </View>

            {AddPageModal}

            <View style={{ margin: 10, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }}>
                <FlatList
                    style={{ width: '100%', padding: padding, paddingTop: 0, paddingBottom: 0, }}
                    data={pages}
                    contentContainerStyle={{ gap: 10 }}
                    columnWrapperStyle={{ gap: 10 }}
                    renderItem={({ item }) => <PageTileComponent page={item} />}
                    numColumns={2} />
            </View>
        </>
    )
}

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

function useModal<const TProps extends UseModalProps>({
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
            <View style={styles.modalContent}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <FontAwesome.Button
                        color='black'
                        backgroundColor={"transparent"}
                        iconStyle={{ marginRight: 0 }}
                        name={"close"}
                        onPress={onClose}
                        size={15} />
                </View>
                <View style={styles.content}>
                    <Text>children here</Text>

                    {Object.keys(inputTypes).map(key => {
                        const input = inputTypes[key]
                        switch (input.type) {
                            case "string":
                                return (
                                    <TextInput onChangeText={text => onInputChange({ ...input, key: key }, text)} />
                                )
                            case "number":
                                return (
                                    <TextInput keyboardType='numeric' onChangeText={text => onInputChange({ ...input, key: key }, Number(text.replace(/[^0-9]/g, '')))} />
                                )
                            case "select":
                                return (
                                    <Picker<string>
                                        selectedValue={inputStates[key] as string}
                                        onValueChange={(itemValue, itemIndex) => onInputChange({ ...input, key: key }, itemValue)}
                                    >
                                        {
                                            input.options.map(option => <Picker.Item label={option} value={option} />)
                                        }
                                    </Picker>
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

const styles = StyleSheet.create({
    modalContent: {
        height: "auto",
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
        justifyContent: 'space-between',
    },
    title: {
        color: '#000',
        fontSize: 16,
    },
    content: {
        padding: 10
    }
});

export default HomePage