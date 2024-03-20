import { ResultSet } from 'expo-sqlite'
import React, { useEffect, useState } from 'react'
import { FlatList, LogBox, View } from 'react-native'
import { IconButton } from './components/IconButton'
import { useModal } from './components/modal/Modal'
import { GenericTile } from './components/tiles/GenericTile'
import TitleDisplay from './components/TitleDisplay'
import { Page } from './constants/DbTypes'
import { globalStyles } from './constants/global'
import { deletePage, getPages, insertPages } from './db/pages'

const HomePage = () => {
    LogBox.ignoreLogs(['new NativeEventEmitter'])

    const [pages, setPages] = useState<Page[]>([])
    const [isEditMode, setIsEditMode] = useState(false)

    const { setVisible, component: AddPageModal } = useModal<{
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
                onClick: (data) => {
                    addPage(data['Page Name'])
                },
                icon: 'plus'
            }
        }
    });

    const addPage = (name: string) => {
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
    const removePage = (page: Page) => {
        deletePage(page, (err, res) => {
            if (err) {
                console.error("Error deleting page: ", err)
            } else {
                console.info("Deleted page: ", res)
                setPages(pages.filter(p => p.id != page.id))
            }
        });
    }

    useEffect(() => {
        getPages((_err, res) => {
            if (res[0] != undefined)
                setPages(res)
        })
    }, [])

    const padding = 5
    const numColumns = 2
    return (
        <View>
            <TitleDisplay text='Welcome!' secondaryText={`You have ${pages.length} pages.`} />

            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', paddingRight: 20 }]}>
                <IconButton iconName='plus' text='Add' onPress={() => setVisible(true)} />
                <IconButton iconName='edit' text='Edit' onPress={() => setIsEditMode(!isEditMode)} type={isEditMode ? 'secondary' : 'primary'} />
            </View>

            {AddPageModal}

            <View
                style={{ margin: 10, }}>
                <FlatList
                    style={{ width: '100%', padding: padding, paddingTop: 0, paddingBottom: 0, }}
                    data={pages}
                    contentContainerStyle={{ gap: 10 }}
                    columnWrapperStyle={{ gap: 10 }}
                    renderItem={({ item }) =>
                        <GenericTile
                            element={item}
                            numColumns={numColumns}
                            isEditMode={isEditMode}
                            doAfterEdit={(page) => { setPages(pages.map(p => p.id == page.id ? page : p)) }}
                            onPressDelete={() => removePage(item)} />
                    }
                    numColumns={numColumns} />
            </View>
        </View>
    )
}

export default HomePage