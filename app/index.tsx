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

const HomePage = () => {
    LogBox.ignoreLogs(['new NativeEventEmitter'])

    const [pages, setPages] = useState<Page[]>([])
    const [queried, setQueried] = useState(false)

    const { setVisible, component: AddPageModal, inputStates } = useModal({
        title: "Add Page",
        inputTypes: {
            "Page Name": {
                type: "string"
            }
        } as const
    });

    type TestType<TType extends readonly UseModalInputType[], TTType = TType[number]> = {
        readonly [key in TType[number]["label"]]: TTType extends "number" ? number : string
    }

    const inputTypes = [{
        label: "Page Name",
        type: "string"
    }, {
        type: "number",
        label: "lksdflsjdf"
    }] as const

    type Test = TestType<typeof inputTypes>

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
    options: string[]
}

type UseModalProps = {
    title: string
    inputTypes: Record<string, UseModalInputType>
}

type InputStateType<TProps extends Record<string, UseModalInputType>> = {
    [key in keyof TProps]: TProps[key]["type"] extends "number" ? number : string
}

type UseModalReturn<TProps extends Record<string, UseModalInputType>> = {
    visible: boolean
    setVisible: (visible: boolean) => void
    component: ReactNode
    inputStates: InputStateType<TProps>
}

function useModal<TProps extends UseModalProps>({
    title,
    inputTypes
}: TProps) {

    const defaultState: InputStateType<typeof inputTypes> = Object.keys(inputTypes).reduce((prev, key) => {
        const result = { ...prev };
        result[key] = inputTypes[key].type === "number" ? 0 : "";
        return result;
    }, {} as InputStateType<typeof inputTypes>)

    const [visible, setVisible] = useState(false)
    const [inputStates, setInputStates] = useState(defaultState)

    const onClose = () => {
        setVisible(false)
    }

    const onInputChange = <
        TKey extends UseModalInputType,
        TValue extends (TKey["type"] extends "number" ? number : string)
    >(key: TKey, value: TValue) => {
        const newInputStates = { ...inputStates }
        newInputStates[key.label] = value
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
                                    <TextInput onChangeText={text => onInputChange(input, text)} />
                                )
                            case "number":
                                return (
                                    <TextInput />
                                )
                            case "select":
                                return (
                                    <TextInput />
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
    } satisfies UseModalReturn<typeof inputTypes>
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