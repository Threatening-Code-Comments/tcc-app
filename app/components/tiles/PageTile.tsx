import { default as React, useEffect, useState } from "react"
import { Text, View } from "react-native"
import { Page } from "../../constants/DbTypes"
import { ColorWithContrast, getColorWithContrast } from "../Colors"
import { TileProps } from "./GenericTile"
import { tileStyles } from "./styles"
import { getFlex, LinkOrPressable } from "./util"

type PageTileComponentProps = {
    page: Page,
    isEditMode: boolean,
    onPress: () => void,
    onPressDelete: () => void,
    isOnDashboard?: boolean
} & TileProps
export const PageTileComponent = ({ page, numColumns, isEditMode, onPressDelete, onPress, isOnDashboard = false }: PageTileComponentProps) => {
    const [color, setColor] = useState<ColorWithContrast>({ color: "#000000", contrastColor: "#000000" })
    const updateColor = async (c: ColorWithContrast) => { setColor(c) }
    useEffect(() => {
        updateColor(getColorWithContrast(page.color))
    }, [])

    return (
        <View style={{ display: 'flex', flexDirection: 'column', flex: getFlex(numColumns), }}>
            {/* <ComponentTypeDisplay display={isOnDashboard} text="P" /> */}
            <LinkOrPressable style={[tileStyles.card, { zIndex: 1, shadowColor: color.color, shadowOpacity: 0.2, elevation: 6, shadowRadius: 3, shadowOffset: { height: 50, width: 200 } }]} link={`/pages/${page.id}`} isLink={!isEditMode} onPress={onPress}>
                <Text style={{ ...tileStyles.name, color: color.color }}>{page.name}</Text>
            </LinkOrPressable>
        </View>
    )
}