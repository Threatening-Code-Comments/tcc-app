import { ResultSet } from 'expo-sqlite'
import React, { useEffect, useState } from 'react'
import { FlatList, LogBox, View, Text } from 'react-native'
import { IconButton } from './components/IconButton'
import { useModal } from './components/modal/Modal'
import { GenericTile } from './components/tiles/GenericTile'
import TitleDisplay from './components/TitleDisplay'
import { Page } from './constants/DbTypes'
import { globalStyles } from './constants/global'
import { deletePage, getPages, insertPages } from './db/pages'
import Dashboard from './Dashboard'
import PageDisplay from './PageDisplay'
import ModalTester from './components/modal/ModalTester'

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
    return (
        <View style={{ display: "flex", height: "100%" }}>
            <TitleDisplay text='Welcome!' secondaryText={`You have ${pages.length} pages.`} height={100} />

            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', paddingRight: 20 }]}>
                <IconButton iconName='plus' text='Add' onPress={() => setVisible(true)} />
                <IconButton iconName='edit' text='Edit' onPress={() => setIsEditMode(!isEditMode)} type={isEditMode ? 'secondary' : 'primary'} />

                {/* <ModalTester /> */}
            </View>

            {AddPageModal}

            <View style={{ flexGrow: 1 }}>
                <Dashboard isEditMode={isEditMode} />
            </View>

            <View style={{ height: 200, marginTop: "auto" }}>
                <PageDisplay
                    isEditMode={isEditMode}
                    pages={pages}
                    doAfterEdit={(page) => { setPages(pages.map(p => p.id == page.id ? page : p)) }}
                    onPressDelete={(item) => removePage(item)}
                />
            </View>
        </View>
    )
}

export default HomePage