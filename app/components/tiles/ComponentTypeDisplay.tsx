import { default as React } from "react"
import { Text, View } from "react-native"
import { colors } from "../../constants/global"

type ComponentTypeDisplayProps = {
    display?: boolean
    text: string
}
export const ComponentTypeDisplay = ({ display = false, text }: ComponentTypeDisplayProps) => {
    if (!display) return <></>
    return (
        <View style={{ zIndex: 2, marginBottom: -50, marginLeft: 10, width: '45%', height: 50, alignSelf: 'flex-start', }}>
            <Text style={{ color: colors.primary, fontSize: 30, textShadowColor: "#000000", textShadowRadius: 10 }}>{text}</Text>
        </View>
    )
}