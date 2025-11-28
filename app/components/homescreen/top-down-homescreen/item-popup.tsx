import React, {useEffect} from "react";
import {HS3Element, HS3Folder, HS3Item} from "@components/homescreen/3-homescreen/3_homescreenHandler";
import {Modal, Pressable, View} from "react-native";
import {Text} from 'react-native-paper'
import {getElementKey} from "@components/homescreen/3-homescreen/3_util";

type Props = {
    item: HS3Item | undefined,
    folders: HS3Folder[]
}

function getItemPath(e: HS3Element, folders: HS3Folder[]) {
    const parentId = e.parentId

    if (parentId === undefined) {
        return "/"
    } else {
        const parent = folders.find(f => f.folderId === parentId)
        return getItemPath(parent, folders) + getElementKey(parent) + "/"
    }
}

export const useItemPopup = (props: Props) => {
    const {item, folders} = props
    const [isVisible, setIsVisible] = React.useState(false);

    const hidePopup = () => {
        setIsVisible(false);
    }
    useEffect(() => {
        console.log("isVi", isVisible)
    }, [isVisible])

    // const item = useDeri
    const bgStyle = ({
        position: "absolute",
        top: 0, right: 0,
        width: '100%', height: '100%',
        zIndex: 50,
    }) as const

    const popupSafezoneStyle = {
        position: 'absolute', top: 0, left: 0,
        width: '80%', marginHorizontal: '10%',
        height: '80%', marginVertical: '10%',
        // backgroundColor: 'yellow',
        pointerEvents: 'auto',
        alignItems: 'center', alignContent: 'center', justifyContent: 'center'
    } as const

    const popupStyle = {
        width: '100%',
        height: 'auto', minHeight: 50,
        backgroundColor: '#2b2a2a',
        borderRadius: 5,
        padding: 15,
    } as const

    const component =
        (!!item && isVisible)
            ? <Modal
                visible={isVisible}
                transparent
                animationType="fade"
                onRequestClose={hidePopup}
                onDismiss={hidePopup}
            >

                <Pressable style={bgStyle} onPress={() => {
                    hidePopup()
                }}/>

                {/*Wrapper for actual popup*/}
                <View style={popupSafezoneStyle}>
                    <View style={popupStyle}>
                        {/*<View style={{height: 30}}/>*/}
                        <Text variant={"displaySmall"}>Item: {item.itemId}</Text>
                        <Text>Currently at {getItemPath(item, folders)}</Text>
                    </View>

                </View>

            </Modal>

            : null


    return {
        visible: isVisible,
        setVisible: setIsVisible,
        component,
    }
}
