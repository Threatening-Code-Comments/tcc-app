import React from "react"
import { FlatList, View, Text } from "react-native"
import { GenericTile } from "./components/tiles/GenericTile"
import { Page } from "./constants/DbTypes"

type PageDisplayProps = {
    pages: Page[]
    isEditMode: boolean
    doAfterEdit: (element: Page) => void
    onPressDelete: (element: Page) => void
}

export default function PageDisplay({ pages, isEditMode, doAfterEdit, onPressDelete }: PageDisplayProps) {

    return (
        <View style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
            <View style={{ height: 15, borderColor: 'gray', borderTopWidth: 2, margin: 10, paddingTop: 5 }}>
                <Text style={{color: 'white', fontSize: 20, height: 30, textAlign: 'center', fontWeight: 'bold' }}>Pages:</Text>
            </View>
            <FlatList
                style={{ marginLeft: 10, marginBottom: 10, }}
                data={pages}
                horizontal
                showsHorizontalScrollIndicator={true}
                renderItem={({ item }) =>
                    <GenericTile
                        element={item}
                        numColumns={1}
                        isEditMode={isEditMode}
                        doAfterEdit={doAfterEdit}
                        onPressDelete={() => onPressDelete(item)} />
                } />
        </View>
    )
}