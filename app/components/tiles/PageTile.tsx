import { default as React, useEffect, useState } from "react"
import { Text } from "react-native"
import { Card } from 'react-native-paper'
import { Page } from "../../constants/DbTypes"
import { ColorWithContrast, getColorWithContrast } from "../Colors"
import { TileProps } from "./GenericTile"
import { newTileStyles, tileStyles } from "./styles"
import { LinkOrPressable } from "./util"

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
    }, [page.color])

    return (
        <Card style={{
            ...newTileStyles.pageTile,
            shadowColor: color.color
        }}>
            <LinkOrPressable style={newTileStyles.linkOrPressable} link={`/pages/${page.id}`} isLink={!isEditMode} onPress={onPress}>
                <Text style={{ ...tileStyles.name, color: color.color }}>{page.name}</Text>
            </LinkOrPressable>
        </Card>
    )
}