import React from "react";
import {FAB, Text} from "react-native-paper";
import Animated from "react-native-reanimated";
import {View} from "react-native";
import {Folder, Item} from "@components/homescreen/ui/item-and-folder";
import {PreviewItem} from "@homescreen/ui/preview-item";
import {getElementKey, goUpLevel, isSameElement} from "@components/homescreen/util";
import {IconButton} from "@components/IconButton";
import {GestureDetector} from "react-native-gesture-handler";
import {FolderPopover} from "@components/homescreen/ui/folder-popover";
import {DotGridBackground} from "@homescreen/ui/dot-grid";
import {useHomescreenContext} from "@components/homescreen/homescreen-context";
import {HS3Element} from "@components/homescreen/types";

/**
 * Pure rendering of the current homescreen level — everything it needs comes from
 * HomescreenContext, which HomescreenManager populates with state + handlers.
 */
export const Homescreen = () => {
    const {
        mountKey,
        folders, currentLevel, folderPath, visibleElements,
        dragState, previewElement, dropTarget, tempElements, tempElementsImpossible,
        homescreenState, showCreateFABs,
        onDragStart, onDragUpdate, onDragEnd, onElementTap, onLongTap,
        onResizeUpdate, onResizeEnd, onFolderPopoverChange,
        editBackgroundStyle, folderOverlayStyle, longTap,
        itemPopupComponent, createPositionOverlay, tileCreatePopup,
    } = useHomescreenContext()

    const isEditMode = homescreenState.value === "edit"

    const impossibleElementKeys = new Set(tempElementsImpossible.value.map(getElementKey))

    const stableElements = visibleElements.value
        .filter(e => !tempElements.value.some(e2 => isSameElement(e, e2)))

    const createFabProps = showCreateFABs.value
        ? {icon: "window-close", label: "Cancel", variant: "tertiary" as const}
        : {icon: "plus", label: "", variant: "primary" as const}

    const renderElement = (e: HS3Element) =>
        ("itemId" in e)
            ? <Item key={`${mountKey}-${currentLevel.value}-t-${e.itemId}`} item={e}
                    onDragStart={() => onDragStart(e)}
                    onDragUpdate={(coordinate) => onDragUpdate(e, coordinate)}
                    onDragEnd={() => onDragEnd(e)}
                    onTap={() => onElementTap(e)}
                    onLongPress={(coordinate) => onLongTap(e, coordinate)}
                    isEditMode={isEditMode}
                    onResizeUpdate={(pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY)}
                    onResizeEnd={(pos) => onResizeEnd(e, pos)}
            />
            : <Folder key={`${mountKey}-${currentLevel.value}-f-${e.folderId}`} folder={e}
                      onDragStart={() => onDragStart(e)}
                      onDragUpdate={(coordinate) => onDragUpdate(e, coordinate)}
                      onDragEnd={() => onDragEnd(e)}
                      onTap={() => onElementTap(e)}
                      onLongPress={(coordinate) => onLongTap(e, coordinate)}
                      isEditMode={isEditMode}
                      onResizeUpdate={(pos, deltaX, deltaY) => onResizeUpdate(e, pos, deltaX, deltaY)}
                      onResizeEnd={(pos) => onResizeEnd(e, pos)}
                      children={folders.value.filter(f => f.parentId === e.folderId)}
            />

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

        {!dropTarget.value && (<PreviewItem
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

        {tempElements.value.map(i => (
            <PreviewItem
                key={getElementKey(i)}
                element={i}
                impossible={impossibleElementKeys.has(getElementKey(i))}
            />
        ))}

        {createPositionOverlay.component}
        {tileCreatePopup.component}
        <FAB style={{
            position: "absolute",
            right: 20, bottom: 150,
            zIndex: 100,
        }} size={"medium"}
             {...createFabProps}
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

        {stableElements.map(renderElement)}
    </>
}
