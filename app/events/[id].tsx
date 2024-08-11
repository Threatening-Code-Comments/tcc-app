import { useLocalSearchParams } from "expo-router"
import React from "react"
import { Text } from "react-native-paper"
import { RoutineEventDisplay } from "./RoutineEventDisplay"
import { ElementTypeNames } from "@app/constants/DbTypes"

type EventPageProps = {

}
const EventPage = ({ }: EventPageProps) => {
    const url = useLocalSearchParams()['id']
    const key = url.slice(0, 1)

    const keyType =
        (key === "r") ? ElementTypeNames.Routine :
            (key === "p") ? ElementTypeNames.Page :
                ElementTypeNames.Tile

    const id = +url.slice(1) //everything after the first character

    return (<>
        <Text>Event Page!!</Text>
        <Text>Id: {id}</Text>
        <Text>KeyType: {keyType}</Text>

        {keyType === ElementTypeNames.Routine ?
            <RoutineEventDisplay routineId={id} />
            : null
        }
    </>)
}

export default EventPage