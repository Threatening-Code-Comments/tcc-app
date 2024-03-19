import { default as React } from "react"
import { Text, View } from "react-native"
import { Page } from "../../constants/DbTypes"
import { TileProps } from "./GenericTile"
import { tileStyles } from "./styles"
import { getFlex, DeleteButton, LinkOrPressable } from "./util"

type PageTileComponentProps = {
    page: Page,
    isEditMode: boolean,
    onPress: () => void,
    onPressDelete: () => void,
} & TileProps
export const PageTileComponent = ({ page, numColumns, isEditMode, onPressDelete, onPress }: PageTileComponentProps) => {
    return (
        <View style={{ display: 'flex', flexDirection: 'column', flex: getFlex(numColumns) }}>
            <DeleteButton isEditMode={isEditMode} onPress={onPressDelete} />
            <LinkOrPressable style={[tileStyles.card, { zIndex: 1 }]} link={`/pages/${page.id}`} isLink={!isEditMode} onPress={onPress}>
                <Text style={tileStyles.name}>{page.name}</Text>
            </LinkOrPressable>
        </View>
    )
}