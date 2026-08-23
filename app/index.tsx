import {desc, eq} from 'drizzle-orm'
import {useLiveQuery} from 'drizzle-orm/expo-sqlite'
import {useMigrations} from 'drizzle-orm/expo-sqlite/migrator'
import migrations from 'drizzle/migrations'
import React, {useEffect, useState} from 'react'
import {LogBox, View} from 'react-native'
import {Card, Text} from 'react-native-paper'
import {useModal} from '@components/modal/Modal'
import {DashboardEntry, Page} from './constants/DbTypes'
import {db} from '@db/database'
import {deletePage, getPages, insertPages} from '@db/pages'
import * as schema from './db/schema'
import {exportDbFile, importDbFile, saveDbFileToDownloads} from './db/backup'
import {HomescreenComponent} from '@components/homescreen/homescreenComponent'

const HomePage = () => {
    LogBox.ignoreLogs(['new NativeEventEmitter'])

    const [pages, setPages] = useState<Page[]>([])
    const [isEditMode, setIsEditMode] = useState(false)
    const [dashboardList, setDashboardList] = useState<DashboardEntry[]>([])

    const {success: migrationSuccess, error: migrationError} = useMigrations(db(), migrations)
    const {data: dashboardLiveQuery} = useLiveQuery(db().select().from(schema.dashboard).orderBy(desc(schema.dashboard.timeAdded)))
    useEffect(() => {
        const list = dashboardLiveQuery.sort((a, b) => b.timeAdded.getTime() - a.timeAdded.getTime())
        setDashboardList(list)
    }, [dashboardLiveQuery])
    const {data: pagesLiveQuery} = useLiveQuery(db().select().from(schema.pages))
    useEffect(() => {
        setPages(pagesLiveQuery)
    }, [pagesLiveQuery])

    const {setVisible, component: AddPageModal} = useModal<{
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
                icon: 'add'
            }
        }
    });

    const migrationModal = useModal<{
        "Speichern (Datei)": "button"
        "Teilen (Datei)": "button"
        "Import (Datei)": "button"
    }>({
        title: "Backup",
        inputTypes: {
            "Speichern (Datei)": {
                icon: 'save',
                type: 'button',
                onClick: saveDbFileToDownloads
            },
            "Teilen (Datei)": {
                icon: 'arrowUp',
                type: 'button',
                onClick: exportDbFile
            },
            "Import (Datei)": {
                icon: 'add',
                type: 'button',
                onClick: importDbFile
            }
        }
    });

    const addPage = (name: string, color: string) => {
        setVisible(false)

        insertPages(
            [{name: name, color: color}],
            (err, res) => {
                if (err) {
                    console.error("Error inserting page: ", err)
                } else {
                    console.info("Inserted page: ", res)
                    setPages([...pages, {id: res[0].lastInsertRowId, name: name, color: color}])
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

    const migrationButton = async () => {
        migrationModal.setVisible(true)
    }

    // return (
    //     <SafeAreaView style={{ flex: 1 }}>
    //         <Card>
    //             {/* <Text>Hi</Text> */}
    //             <Card.Title title="Card Title" subtitle="Card Subtitle" left={p => <Text>{p.size}</Text>} />
    //             <Card.Content>
    //                 <Text variant="titleLarge">Card title</Text>
    //                 <Text variant="bodyMedium">Card content</Text>
    //             </Card.Content>
    //             <Card.Cover source={{ uri: 'https://picsum.photos/700' }} />
    //             <Card.Actions>
    //                 <Button>Cancel</Button>
    //                 <Button>Ok</Button>
    //             </Card.Actions>
    //         </Card>
    //     </SafeAreaView>
    // )

    const padding = 5
    return (
        <View style={{display: "flex", height: "100%", width: '100%'}}>
            {/*<TitleDisplay text='Welcome!' secondaryText={`You have ${pages.length} pages.`} height={100} />*/}

            {/*<View style={[globalStyles.iconButtonContainer, { justifyContent: 'flex-end', paddingRight: 20 }]}>*/}
            {/*    <IconButton iconName='add' text='Add' onPress={() => setVisible(true)} />*/}
            {/*    <IconButton iconName='edit' text='Edit' onPress={() => setIsEditMode(!isEditMode)} type={isEditMode ? 'secondary' : 'primary'} />*/}
            {/*    /!* <IconButton iconName='question' text='Query' onPress={() => getPagesFromIds([1], (err, res) => console.log("tiles:", res))} />*/}
            {/*    <IconButton iconName='arrow-right' text='Migrate' onPress={migrate} /> *!/*/}
            {/*    /!* <IconButton iconName='list-ul' text='Events' /> *!/*/}
            {/*    /!* <ModalTester /> *!/*/}
            {/*    <IconButton iconName='db' text='Migrate' onPress={migrationButton} />*/}
            {/*</View>*/}

            {AddPageModal}
            {migrationModal.component}

            {/* <View style={{  }}> */}
            <Card elevation={1} style={{flexGrow: 1, margin: '5%', width: '90%'}}>

                {/* <Dashboard isEditMode={isEditMode} dashboardList={{ list: dashboardList, setList: setDashboardList }} /> */}

                <HomescreenComponent/>

            </Card>
            {/* <TestComponent elementList={dashboardList} /> */}
            {/* </View> */}

            {/*<View style={{ height: 200, marginTop: "auto" }}>*/}
            {/*    <PageDisplay*/}
            {/*        isEditMode={isEditMode}*/}
            {/*        pages={pages}*/}
            {/*        doAfterEdit={updatePage}*/}
            {/*        onPressDelete={(item) => removePage(item)}*/}
            {/*        dashboardList={{ list: dashboardList, setList: setDashboardList }}*/}
            {/*    />*/}
            {/*</View>*/}
        </View>
    )
}

export default HomePage