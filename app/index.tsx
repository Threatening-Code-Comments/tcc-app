import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import migrations from 'drizzle/migrations'
import { useNavigation } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { LogBox, Text, ToastAndroid, View } from 'react-native'
import { getRandomColor } from './components/Colors'
import { IconButton } from './components/IconButton'
import { useModal } from './components/modal/Modal'
import TitleDisplay from './components/TitleDisplay'
import { DashboardEntry, Page } from './constants/DbTypes'
import { globalStyles } from './constants/global'
import { getDashboardEntries } from './db/dashboard'
import { db, DbErrors, initDb } from './db/database'
import { deletePage, getPages, getPagesFromIds, insertPages } from './db/pages'
import * as schema from './db/schema'
import PageDisplay from './PageDisplay'
import Dashboard from './Dashboard'
import TestComponent from './TestComponent'
import { asc, desc } from 'drizzle-orm'

const HomePage = () => {
    LogBox.ignoreLogs(['new NativeEventEmitter'])

    const [pages, setPages] = useState<Page[]>([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [dashboardList, setDashboardList] = useState<DashboardEntry[]>([])

    const { success: migrationSuccess, error: migrationError } = useMigrations(db(), migrations)
    const { data } = useLiveQuery(db().select().from(schema.dashboard).orderBy(desc(schema.dashboard.timeAdded)))
    useEffect(() => {
        const list = data.sort((a, b) => b.timeAdded.getTime() - a.timeAdded.getTime())
        setDashboardList(list)
    }, [data])

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
            [{ name: name, color: getRandomColor() }],
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

    const migrate = () => {
        ToastAndroid.showWithGravity("Migrating...", ToastAndroid.SHORT, ToastAndroid.CENTER)
        initDb(
            (err, res) => {
                if (err && err != DbErrors.ALREADY_MIGRATED)
                    ToastAndroid.showWithGravity("Migration failed", ToastAndroid.SHORT, ToastAndroid.CENTER)
                else
                    ToastAndroid.showWithGravity("Migration successful", ToastAndroid.SHORT, ToastAndroid.CENTER)
            }
        )
    }

    const padding = 5
    return (
        <View style={{ display: "flex", height: "100%" }}>
            <TitleDisplay text='Welcome!' secondaryText={`You have ${pages.length} pages.`} height={100} />

            <View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', paddingRight: 20 }]}>
                <IconButton iconName='plus' text='Add' onPress={() => setVisible(true)} />
                <IconButton iconName='edit' text='Edit' onPress={() => setIsEditMode(!isEditMode)} type={isEditMode ? 'secondary' : 'primary'} />
                <IconButton iconName='question' text='Query' onPress={() => getPagesFromIds([1], (err, res) => console.log("tiles:", res))} />
                <IconButton iconName='arrow-right' text='Migrate' onPress={migrate} />
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
                    doAfterEdit={(page) => { setPages(pages.map(p => p.id == page.id ? page : p)) }}
                    onPressDelete={(item) => removePage(item)}
                    dashboardList={{ list: dashboardList, setList: setDashboardList }}
                />
            </View>
        </View>
    )
}

export default HomePage