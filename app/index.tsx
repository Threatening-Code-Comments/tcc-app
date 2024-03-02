import { ResultSet } from 'expo-sqlite'
import React, { useState } from 'react'
import { FlatList, LogBox, View } from 'react-native'
import { IconButton } from './components/IconButton'
import { PageTileComponent } from './components/Tiles'
import TitleDisplay from './components/TitleDisplay'
import { useModal } from './components/modal/Modal'
import { Page } from './constants/DbTypes'
import { globalStyles } from './constants/global'
import { dropDb } from './db/database'
import { getPages, insertPages } from './db/pages'

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
            },
            "Add": {
                type: "button",
                onClick: () => {
                    console.log("Hell yeah!!")
                    console.log(inputStates["Page Name"])
                    addPage(inputStates["Page Name"] as string)
                },
                icon: 'amazon'
            }
        }
    } as const);

    const addPage = (name: string) => {
        // setVisible(true)
        setVisible(false)

        insertPages(
            [{ name: name }],
            (err, res) => {
                if (err) {
                    console.error("Error inserting page: ", err)
                } else {
                    console.info("Inserted page: ", res)
                    setPages([...pages, { id: (res[0] as ResultSet).insertId, name: name }])
                }
            })
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
        <View>
            <TitleDisplay text='Welcome!' secondaryText={`You have ${pages.length} pages.`} />

            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', margin: 10 }]}>
                <IconButton iconName='plus' text='Add' onPress={() => setVisible(true)} type='primary' />
                <IconButton iconName='refresh' text='Refresh' onPress={query} type='secondary' />
                <IconButton iconName='trash' text='Drop DB' onPress={dropDb} type='error' />
            </View>

            {AddPageModal}

            <View
                style={{ margin: 10, }}>
                <FlatList
                    style={{ width: '100%', padding: padding, paddingTop: 0, paddingBottom: 0, }}
                    data={pages}
                    contentContainerStyle={{ gap: 10 }}
                    columnWrapperStyle={{ gap: 10 }}
                    renderItem={({ item }) => <PageTileComponent page={item} />}
                    numColumns={2} />
            </View>
        </View>
    )
}

export default HomePage