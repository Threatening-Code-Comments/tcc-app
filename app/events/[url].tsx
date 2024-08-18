import { useLocalSearchParams } from "expo-router"
import React from "react"
import { Text } from "react-native-paper"
import { RoutineEventDisplay } from "./RoutineEventDisplay"
import { ElementTypeNames } from "@app/constants/DbTypes"
import { ScrollView, View } from "react-native"

type EventPageProps = {

}
const EventPage = ({ }: EventPageProps) => {
    const url = useLocalSearchParams()['url']
    const key = url.slice(0, 1)

    const keyType =
        (key === "r") ? ElementTypeNames.Routine :
            (key === "p") ? ElementTypeNames.Page :
                ElementTypeNames.Tile

    const id = +url.slice(1) //everything after the first character

    return (<>
        <View style={{ display: 'flex', flexDirection: 'row', height: 120 }}>
            <View style={{ flex: 2 }}>
                <Text>Event Page!!</Text>
                <Text>Id: {id}</Text>
                <Text>KeyType: {keyType}</Text>
            </View>
            <View style={{ flex: 3 }}>
                <Text>Event Page!!</Text>
            </View>
        </View>

        <ScrollView>
            {keyType === ElementTypeNames.Routine ?
                <RoutineEventDisplay routineId={id} />
                : null
            }
        </ScrollView>
    </>)
}

export default EventPage