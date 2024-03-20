import React from "react"
import { FlatList } from "react-native"
import { GenericTile } from "./components/tiles/GenericTile"
import { Page } from "./constants/DbTypes"

type PageDisplayProps = {
    pages: Page[]
    padding: number
    isEditMode: boolean
    doAfterEdit: (element: Page) => void
    onPressDelete: (element: Page) => void
}

export default function PageDisplay({pages, padding, isEditMode, doAfterEdit, onPressDelete}: PageDisplayProps) {
    
    return (
        <FlatList
            style={{ width: '100%', padding: padding, paddingTop: 0, paddingBottom: 0 }}
            data={pages}
            contentContainerStyle={{ gap: 10 }}
            horizontal
            showsHorizontalScrollIndicator={true}
            renderItem={({ item }) =>
                <GenericTile
                    element={item}
                    numColumns={1}
                    orientation='row'
                    isEditMode={isEditMode}
                    doAfterEdit={doAfterEdit}
                    onPressDelete={() => onPressDelete(item)} />
            } />
    )
}