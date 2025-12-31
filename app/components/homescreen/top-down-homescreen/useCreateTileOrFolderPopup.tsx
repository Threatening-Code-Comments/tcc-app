import React from "react";
import {usePopup} from "@components/hooks/usePopup";
import {Text} from "react-native-paper";
import {HS3Folder} from "@components/homescreen/3-homescreen/3_homescreenHandler";

type Props = {
    folders: HS3Folder[],
    currentLevel: number
}

export const useCreateTilePopup = (props: Props) => {
    // const newTileId =

    const popupContent = (<>
        <Text variant={"headlineSmall"}>Create Tile no parent ayyy</Text>


    </>)

    const popup = usePopup({children: popupContent})

    return {
        visible: popup.visible,
        setVisible: popup.setVisible,
        component: popup.component,
    }
}