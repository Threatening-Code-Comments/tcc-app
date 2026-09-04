import React from "react";
import {FAB, Text} from "react-native-paper";
import Animated from "react-native-reanimated";
import {View} from "react-native";
import {Folder4, Item4} from "@components/homescreen/top-down-homescreen/item-and-folder";
import {PreviewItem3} from "@homescreen/top-down-homescreen/3_previewItem";
import {getElementKey, goUpLevel, isSameElement} from "@components/homescreen/top-down-homescreen/top-down-util";
import {IconButton} from "@components/IconButton";
import {GestureDetector} from "react-native-gesture-handler";
import {FolderPopover} from "@components/homescreen/top-down-homescreen/folder-popover";
import {DotGridBackground} from "@homescreen/top-down-homescreen/dot-grid";
import {useHomescreenContext} from "@components/homescreen/top-down-homescreen/homescreen-context";

/**
 * Pure rendering of the current homescreen level — everything it needs comes from
 * HomescreenContext, which HomescreenManager populates with state + handlers.
 */
export const Homescreen = () => {
    const {
        mountKey,
        folders, currentLevel, folderPath, visibleElements,
        dragState, previewElement, dropTarget, tempItems, tempItemsImpossible,
        homescreenState, showCreateFABs,
        folderRunnables, itemRunnables, onResizeUpdate, onResizeEnd, onFolderPopoverChange,
        editBackgroundStyle, folderOverlayStyle, longTap,
        itemPopupComponent, createPositionOverlay, tileCreatePopup,
    } = useHomescreenContext()

    return <>
        <GestureDetector gesture={longTap}>
            <Animated.View style={editBackgroundStyle}>
                <DotGridBackground mode={homescreenState.value}/>
            </Animated.View>
        </GestureDetector>

        {currentLevel.value !== undefined && (
            <View style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                zIndex: 100,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 10,
                paddingTop: 10,
            }} pointerEvents="box-none">
                <IconButton
                    iconName="back"
                    onPress={() => goUpLevel(currentLevel, folders)}
                />
                <View style={{flexDirection: "row", alignItems: "center", flexWrap: "wrap", flexShrink: 1}}>
                    <Text
                        style={{color: "black", fontWeight: "700"}}
                        onPress={() => {
                            currentLevel.value = undefined
                        }}
                    >
                        Home
                    </Text>
                    {folderPath.value.map((f, index) => (
                        <View key={f.folderId} style={{flexDirection: "row", alignItems: "center"}}>
                            <Text style={{color: "black"}}> / </Text>
                            <Text
                                style={{
                                    color: "black",
                                    fontWeight: index === folderPath.value.length - 1 ? "700" : "400"
                                }}
                                onPress={() => {
                                    currentLevel.value = f.folderId
                                }}
                            >
                                {f.name}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        )}

        {!dropTarget.value && (<PreviewItem3
            element={previewElement.value}
            impossible={false}
            isDragElement={true}
            isCreateElement={dragState.value?.type === "create"}
        />)}
        <Animated.View style={folderOverlayStyle}/>
        {/*TODO popover*/}
        <FolderPopover isAddFolder={dropTarget.value?.element} dragState={dragState.value}
                       onOperationChange={(op) => onFolderPopoverChange(op)}/>

        {itemPopupComponent}

        {tempItems.value.map(i => (
            <PreviewItem3
                key={getElementKey(i)}
                element={i}
                impossible={tempItemsImpossible.value.some(i2 => isSameElement(i, i2))}
            />
        ))}

        {createPositionOverlay.component}
        {tileCreatePopup.component}
        <FAB style={{
            position: "absolute",
            right: 20, bottom: 150,
            zIndex: 100,
        }} size={"medium"}
             icon={!!showCreateFABs.value ?
                 "window-close" : "plus"}

             label={!!showCreateFABs.value ?
                 "Cancel" : ""}
             variant={!!showCreateFABs.value ?
                 "tertiary" : "primary"}


             onPress={() => {
                 showCreateFABs.value = (!showCreateFABs.value)
             }}
        />

        {!!showCreateFABs.value
            ? <View style={{
                position: 'absolute',
                bottom: 230, right: 25,
                width: "100%",
                display: "flex", flexDirection: "row",
                justifyContent: "flex-end",
                gap: 10, zIndex: 100
            }}>
                <FAB icon={"rectangle"}
                     variant={"secondary"}
                     label={"Tile"}
                     style={{zIndex: 100}}
                     onPress={() => tileCreatePopup.setVisible(true)}
                />

                <FAB icon={"folder"}
                     variant={"secondary"}
                     label={"Folder"}
                     style={{zIndex: 100}}
                />
            </View>
            : null}

        {visibleElements.value
            .filter(e => !tempItems.value.some(e2 => isSameElement(e, e2)))
            .map((e, index) =>
                ("itemId" in e)
                    ? <Item4 key={`${mountKey}-${currentLevel.value}-t-${e.itemId}`} item={e}
                             onDragStart={() => itemRunnables.onDragStart(e)}
                             onDragUpdate={(coordinate) => itemRunnables.onDragUpdate(e, coordinate)}
                             onDragEnd={() => itemRunnables.onDragEnd(e)}
                             onTap={() => itemRunnables.onTap(e)}
                             onLongPress={(coordinate) => itemRunnables.onLongTap(e, coordinate)}
                             isEditMode={homescreenState.value === "edit"}
                             onResizeUpdate={(pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY)}
                             onResizeEnd={(pos) => onResizeEnd(e, pos)}
                    />
                    : <Folder4 key={`${mountKey}-${currentLevel.value}-f-${e.folderId}`} folder={e}
                               onDragStart={() => folderRunnables.onDragStart(e)}
                               onDragUpdate={(coordinate) => folderRunnables.onDragUpdate(e, coordinate)}
                               onDragEnd={() => folderRunnables.onDragEnd(e)}
                               onTap={() => folderRunnables.onTap(e)}
                               onLongPress={(coordinate) => folderRunnables.onLongTap(e, coordinate)}
                               isEditMode={homescreenState.value === "edit"}
                               onResizeUpdate={(pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY)}
                               onResizeEnd={(pos) => onResizeEnd(e, pos)}
                               children={folders.value.filter(f => f.parentId === e.folderId)}
                    />
            )

        }
    </>
}
