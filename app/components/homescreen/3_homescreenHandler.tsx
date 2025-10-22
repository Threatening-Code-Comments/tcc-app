import React from "react";
import {GridPoint, PixelPoint} from "@components/homescreen/types";

export type HS3LayoutParams = GridPoint & {
    width: number;
    height: number;
}

export type HS3Element = {
    layout: HS3LayoutParams;
    parentId?: number;
}

export type HS3Item = {
    itemId: number
} & HS3Element;
export type HS3Folder = {
    folderId: number
    items: HS3Item[]
} & HS3Element;

export type DragState = {
    coordinate: PixelPoint
    draggingItem: HS3Element
    isAddFolder: boolean
}

type Props = {

}
const HomescreenHandler3 = ({}: Props) => {
    const [items, setItems] = React.useState([]);
    const [folders, setFolders] = React.useState([]);


//     displayItems
//      addFolder: (dragItem, droppedItem) => {dI, doI, {folder...} }
    return (<>
        </>)
}

export default HomescreenHandler3;