import { desc, eq, inArray } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import migrations from 'drizzle/migrations'
import React, { useEffect, useState } from 'react'
import { AppRegistry, LogBox, Text, View } from 'react-native'
import Dashboard from './Dashboard'
import PageDisplay from './PageDisplay'
import { IconButton } from './components/IconButton'
import TitleDisplay from './components/TitleDisplay'
import { useModal } from './components/modal/Modal'
import { DashboardEntry, Page } from './constants/DbTypes'
import { globalStyles } from './constants/global'
import { db } from './db/database'
import { deletePage, getPages, insertPages, updatePage } from './db/pages'
import * as schema from './db/schema'

const HomePage = () => {
    LogBox.ignoreLogs(['new NativeEventEmitter'])

    const [pages, setPages] = useState<Page[]>([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [dashboardList, setDashboardList] = useState<DashboardEntry[]>([])

    const { success: migrationSuccess, error: migrationError } = useMigrations(db(), migrations)
    const { data: dashboardLiveQuery } = useLiveQuery(db().select().from(schema.dashboard).orderBy(desc(schema.dashboard.timeAdded)))
    useEffect(() => {
        const list = dashboardLiveQuery.sort((a, b) => b.timeAdded.getTime() - a.timeAdded.getTime())
        setDashboardList(list)
    }, [dashboardLiveQuery])
    const { data: pagesLiveQuery } = useLiveQuery(db().select().from(schema.pages))
    useEffect(() => {
        setPages(pagesLiveQuery)
    }, [pagesLiveQuery])

    const { setVisible, component: AddPageModal } = useModal<{
        "Page Name": "string"
        "Add": "submit",
        "Color": "slider-color"
    }>({
        title: "Add Page",
        inputTypes: {
            "Page Name": {
                type: "string"
            },
            "Color": {
                type: "slider-color",
                value: "#FF0000"
            },
            "Add": {
                type: "submit",
                onClick: (data) => {
                    addPage(data['Page Name'], data.Color)
                },
                icon: 'plus'
            }
        }
    });

    const addPage = (name: string, color: string) => {
        setVisible(false)

        insertPages(
            [{ name: name, color: color }],
            (err, res) => {
                if (err) {
                    console.error("Error inserting page: ", err)
                } else {
                    console.info("Inserted page: ", res)
                    setPages([...pages, { id: res[0].lastInsertRowId, name: name, color: color }])
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

    if (migrationError) {
        return (
            <View>
                <Text>Migration error: {migrationError.message}</Text>
            </View>
        );
    }
    if (!migrationSuccess) {
        return (
            <View>
                <Text>Migration is in progress...</Text>
            </View>
        );
    }

    const updatePage = (page: Page) => {
        db().update(schema.pages).set(page).where(eq(schema.pages.id, page.id))

            .then(
                r => setPages(pages.map(p => p.id == page.id ? page : p)),
                err => console.error("updating page failed!", err)
            )
    }

    const padding = 5
    return (
        <View style={{ display: "flex", height: "100%" }}>
            <TitleDisplay text='Welcome!' secondaryText={`You have ${pages.length} pages.`} height={100} />

            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', paddingRight: 20 }]}>
                <IconButton iconName='plus' text='Add' onPress={() => setVisible(true)} />
                <IconButton iconName='edit' text='Edit' onPress={() => setIsEditMode(!isEditMode)} type={isEditMode ? 'secondary' : 'primary'} />
                {/* <IconButton iconName='question' text='Query' onPress={() => getPagesFromIds([1], (err, res) => console.log("tiles:", res))} />
                <IconButton iconName='arrow-right' text='Migrate' onPress={migrate} /> */}
                {/* <IconButton iconName='list-ul' text='Events' /> */}
                {/* <ModalTester /> */}
            </View>

            {AddPageModal}

            <View style={{ flexGrow: 1 }}>
                <Dashboard isEditMode={isEditMode} dashboardList={{ list: dashboardList, setList: setDashboardList }} />
                {/* <TestComponent elementList={dashboardList} /> */}
            </View>

            <View style={{ height: 200, marginTop: "auto" }}>
                <PageDisplay
                    isEditMode={isEditMode}
                    pages={pages}
                    doAfterEdit={updatePage}
                    onPressDelete={(item) => removePage(item)}
                    dashboardList={{ list: dashboardList, setList: setDashboardList }}
                />
            </View>
        </View>
    )
}

// export default HomePage