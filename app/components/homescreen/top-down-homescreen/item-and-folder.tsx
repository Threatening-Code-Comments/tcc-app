import {HS3Folder, HS3Item, HS3LayoutParams} from "@components/homescreen/3-homescreen/3_homescreenHandler";
import {Text} from "react-native-paper";
import React from "react";
import {MovableItem, MovableItemProps} from "@components/homescreen/top-down-homescreen/movable-item";
import {View} from "react-native";

type FolderProps = Omit<MovableItemProps, "children" | "layout"> & {
    folder: HS3Folder
}

export function Folder4(props: FolderProps) {
    const {folder, onDragStart, onDragUpdate, onDragEnd, onTap, onLongPress} = props
    const {layout} = folder

    return <MovableItem
        layout={layout}
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
        onTap={onTap}
        onLongPress={onLongPress}
        isEditMode={props.isEditMode}
    >
        <View style={{
            backgroundColor: 'red', width: '100%', height: '100%',
            borderColor: 'black', borderWidth: 2,
            alignItems: 'center', justifyContent: 'center'
        }}>
            <Text>f{folder.folderId}</Text>
            <Text>{stringyfyLayout(layout)}</Text>
        </View>
    </MovableItem>
}

type Item4Props = Omit<MovableItemProps, "children" | "layout"> & {
    item: HS3Item
}

export function Item4(props: Item4Props) {
    const {item, onDragStart, onDragUpdate, onDragEnd, onTap, onLongPress} = props

    return <MovableItem
        layout={item.layout}
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
        onTap={onTap}
        onLongPress={onLongPress}
        isEditMode={props.isEditMode}
    >
        <View style={{
            backgroundColor: 'blue', width: '100%', height: '100%',
            borderColor: 'black', borderWidth: 1,
            alignItems: 'center', justifyContent: 'center'
        }}>
            <Text>i{item.itemId}</Text>
            <Text>{stringyfyLayout(item.layout)}</Text>
        </View>
    </MovableItem>
}

function stringyfyLayout(layout: HS3LayoutParams) {
    return "x" + layout.x + "y" + layout.y
}