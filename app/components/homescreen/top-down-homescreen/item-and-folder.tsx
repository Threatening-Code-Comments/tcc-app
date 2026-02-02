import {HS3Element, HS3Folder, HS3Item, HS3LayoutParams} from '../types'
import {Text} from "react-native-paper";
import React from "react";
import {MovableItem, MovableItemProps} from "@components/homescreen/top-down-homescreen/movable-item";
import {View} from "react-native";
import {Icon} from "@components/Icon";
import {GRID_COLUMNS} from "@components/homescreen/move_algo";

type FolderProps = Omit<MovableItemProps, "children" | "layout"> & {
    folder: HS3Folder,
    children: HS3Folder[]
}

export function Folder4(props: FolderProps) {
    const {
        folder, onDragStart, onDragUpdate, onDragEnd, onTap, onLongPress,
        onResizeUpdate, onResizeEnd
    } = props
    const {layout} = folder

    return <MovableItem
        layout={layout}
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
        onTap={onTap}
        onLongPress={onLongPress}
        isEditMode={props.isEditMode}
        onResizeUpdate={onResizeUpdate}
        onResizeEnd={onResizeEnd}
    >
        <View style={{
            // backgroundColor: 'white',
            width: '100%', height: '100%',
            // borderRadius: 20,
            // borderColor: 'red', borderWidth: 2,
            alignItems: 'center', justifyContent: 'center',
            elevation: 8,
            pointerEvents: 'box-none'
        }}>
            {/*Folder background*/}
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%', height: '100%',
                backgroundColor: 'transparent',
                margin: -2,
                alignContent: 'center', justifyContent: 'center',
                opacity: 0.7,
                pointerEvents: 'none'
            }}>
                <Icon iconName={"folder"} iconSize={115 * Math.min(layout.width, layout.height)} color={"red"}/>
            </View>

            {/*Name at top left*/}
            <View style={{
                position: 'absolute', top: 0, left: 0, margin: 2, marginTop: 5,
                backgroundColor: '#ffffff99', paddingHorizontal: 2,
                zIndex: 10, minWidth: '30%',
                pointerEvents: 'none'
            }}>
                <Text style={{
                    color: 'black', zIndex: 3, elevation: 3,
                    alignSelf: 'center'
                }}>{folder.name}</Text>
            </View>


            {/*<Text>{stringyfyLayout(layout)}</Text>*/}

            {/*{props.folder.items.map((item, index) => {*/}
            {/*    const {itemId, layout: {x, y}} = item*/}

            {/*    return (<Text key={index}>{item.itemId}: x{x} y{y}</Text>)*/}
            {/*})}*/}
            <ViewPort folderToView={props.folder} children={props.children}/>

        </View>
    </MovableItem>
}


export const ViewPort = (props: { folderToView: HS3Folder, children: HS3Folder[] }) => {
    const {folderToView, children} = props
    const {items} = folderToView

    const maxWidth = GRID_COLUMNS
    const maxHeight = 3

    const getPercentageString = (gridValue: number, maxV: number) => {
        const percentage = gridValue / maxV * 100

        return percentage.toFixed(2) + '%'
    }

    const getElementLayout = (item: HS3Element, index: number) => {
        const {layout: {x, y, width, height}} = item

        return (
            //@ts-expect-error
            <View key={index} style={{
                position: 'absolute',
                left: getPercentageString(x, maxWidth), top: getPercentageString(y, maxHeight),
                width: getPercentageString(width, maxWidth), height: getPercentageString(height, maxHeight),
                borderWidth: 2,
                backgroundColor: ("itemId" in item) ? 'blue' : "red",
                pointerEvents: 'none'
            }}>
                <Text style={{fontSize: 10, pointerEvents: 'none'}}>{item.name}</Text>
            </View>
        )
    }

    return (
        <View style={{
            width: '90%',
            height: '65%',
            marginTop: 15,
            marginBottom: 2,
            marginLeft: -2,
            pointerEvents: 'none'
        }}>

            {items.map(getElementLayout)}
            {children.map(getElementLayout)}

        </View>)
}

type Item4Props = Omit<MovableItemProps, "children" | "layout"> & {
    item: HS3Item
}

export function Item4(props: Item4Props) {
    const {
        item, onDragStart, onDragUpdate, onDragEnd, onTap, onLongPress,
        onResizeUpdate, onResizeEnd
    } = props

    return <MovableItem
        layout={item.layout}
        onDragStart={onDragStart}
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
        onTap={onTap}
        onLongPress={onLongPress}
        isEditMode={props.isEditMode}
        onResizeUpdate={onResizeUpdate}
        onResizeEnd={onResizeEnd}
    >
        <View style={{
            backgroundColor: 'blue', width: '100%', height: '100%',
            borderColor: 'black', borderWidth: 1,
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none'
        }}>
            <Text>{item.name}</Text>
            <Text>{stringyfyLayout(item.layout)}</Text>
        </View>
    </MovableItem>
}

function stringyfyLayout(layout: HS3LayoutParams) {
    return "x" + layout.x + "y" + layout.y
}