import React, {useState} from "react";
import {Text, View} from "react-native";
import {IconButton} from "@components/IconButton";
import {TextField} from "rn-material-ui-textfield";
import {Card} from "react-native-paper";
import {HomescreenItem} from "@components/homescreen/types";

interface AppDrawerProps {
    isOpen: boolean
    onToggle: () => void
    // apps: App[]
    items: HomescreenItem[]
    // draggedItem: HomeScreenItem | App | null
    // onDragStart: (e: React.DragEvent, app: App) => void
    onDragEnd: () => void
    onDrop: (e: React.DragEvent) => void
}

export function AppDrawer({
                              items,
// apps, draggedItem, onDragStart,
                              onDragEnd, onDrop
                          }: AppDrawerProps) {
    const [isOpen, setIsOpen] = useState(false)

    const closeModal = () => {
        console.log("closeModal")
        setIsOpen(false)
    }
    const openModal = () => {
        console.log("openModal")
        setIsOpen(true)
    }
    const toggleModal = () => setIsOpen(!isOpen)

    return (
        <Card
            style={{
                position: 'absolute',
                backgroundColor: "#222",
                bottom: 0,
                left: 0,
                width: "100%",
                height: isOpen ? 500 : 200,
                zIndex: 2000
            }}
        >
            <View style={{
                alignSelf: "center",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <IconButton iconName={isOpen ? "arrowDown" : "arrowUp"} type={"transparent"}
                            onPress={toggleModal}
                            text={"Apps"}/>
            </View>

            <View style={{display: "flex", flexWrap: "wrap", flexDirection: "row"}}>
                {items.map((item, index) => (
                    <View key={index} style={{padding: 10}}>
                        <View style={{}}>

                            <Text>{item.id}</Text>
                        </View>
                    </View>
                ))}
            </View>

        </Card>
    )
}