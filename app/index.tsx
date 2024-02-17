import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { FlatList, LogBox, Text, View } from 'react-native'
import { IconButton } from './components/IconButton'
import { PageTileComponent } from './components/Tiles'
import { Page } from './constants/DbTypes'
import { dropDb, initDb } from './db/database'
import { getPages, insertPages } from './db/pages'


const HomePage = () => {
    LogBox.ignoreLogs(['new NativeEventEmitter'])
    initDb()
    const router = useRouter()

    const [pages, setPages] = useState<Page[]>([])
    const [queried, setQueried] = useState(false)

    const addPage = () => {
        const randomNumber = Math.random()
        insertPages([{ name: `Page |${randomNumber}|` }])
        setQueried(false)
        router.replace('/')
    }

    const query = () => {
        getPages((err, res) => {
            if (res[0] != undefined)
                setPages(res)
        })
        setQueried(true)
    }

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

            <View style={{margin: 10, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', gap: 5}}>
                <FlatList
                    style={{width: '100%', padding: padding, paddingTop: 0, paddingBottom: 0,}}
                    data={pages}
                    contentContainerStyle={{ gap: 10 }}
                    columnWrapperStyle={{ gap: 10 }}
                    renderItem={({ item }) => <PageTileComponent page={item} />}
                    numColumns={2} />
            </View>
        </>
    )
}

export default HomePage