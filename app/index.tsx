import { SQLiteRunResult } from 'expo-sqlite'
import React, { useEffect, useState } from 'react'
import { LogBox, View } from 'react-native'
import { IconButton } from './components/IconButton'
import { useModal } from './components/modal/Modal'
import TitleDisplay from './components/TitleDisplay'
import { DashboardEntry, ElementType, Page } from './constants/DbTypes'
import { globalStyles } from './constants/global'
import Dashboard, { DashboardList } from './Dashboard'
import { deletePage, getPages, getPagesFromIds, insertPages } from './db/pages'
import PageDisplay from './PageDisplay'
import { getDashboardEntries } from './db/dashboard'
import { router } from 'expo-router'
import { getRandomColor } from './components/Colors'
import { getTilesFromIds } from './db/tiles'

const HomePage = () => {
    LogBox.ignoreLogs(['new NativeEventEmitter'])

    const [pages, setPages] = useState<Page[]>([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [dashboardList, setDashboardList] = useState<DashboardEntry[]>([])
    // console.log("list: : " , dashboardList)

    useEffect(() => {
        getDashboardEntries((_err, res) => {
            // console.log("res: ", res)
            setDashboardList(res)
        })
    }, [])

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
                    setPages([...pages, { id: res[0].lastInsertRowId, name: name, color: getRandomColor() }])
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
                <IconButton iconName='question' text='Query' onPress={() => getPagesFromIds([1], (err, res) => console.log("tiles:", res))} />
                {/* <ModalTester /> */}
            </View>

            {AddPageModal}

            <View style={{ flexGrow: 1 }}>
                <Dashboard isEditMode={isEditMode} dashboardList={{ list: dashboardList, setList: setDashboardList }} />
            </View>

            <View style={{ height: 200, marginTop: "auto" }}>
                <PageDisplay
                    isEditMode={isEditMode}
                    pages={pages}
                    doAfterEdit={(page) => { setPages(pages.map(p => p.id == page.id ? page : p)) }}
                    onPressDelete={(item) => removePage(item)}
                    dashboardList={{ list: dashboardList, setList: setDashboardList }}
                />
            </View>
        </View>
    )
}

export default HomePage