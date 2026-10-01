import React, {useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text, useTheme} from 'react-native-paper';
import {AppDrawer} from "@components/homescreen/AppDrawer/AppDrawer";
import {HomescreenNavigator} from "@components/homescreen/navigator";
import {useHomescreenLibraryData} from "@components/homescreen/hooks/useHomescreenLibraryData";
import {HomescreenDataProvider} from "@components/homescreen/homescreen-data-context";
import {DragPreviewOverlay} from "@components/homescreen/ui/components/drag-preview-overlay";

export const HomescreenTempWrapper = () => {
    const {colors} = useTheme();
    const {folders, tiles, tileById, routines, tileEventStats, dragPreview, homescreenAreaBounds, appDrawerDrop, dataLoaded} = useHomescreenLibraryData()
    const gridRef = useRef<View>(null)

    //measures this view's window-absolute bounds — the shared coordinate origin an App
    //Drawer drag's absolute drop point gets converted against (homescreen items are
    //already positioned relative to this same origin, see homescreen.tsx).
    const measureBounds = () => {
        gridRef.current?.measureInWindow((x, y, width, height) => {
            homescreenAreaBounds.value = {x, y, width, height}
        })
    }

    return (
        <View ref={gridRef} onLayout={measureBounds} style={[styles.grid, {backgroundColor: colors.background}]}>
            {dataLoaded
                ? <HomescreenDataProvider value={{folders, tiles, tileById, routines, tileEventStats, dragPreview, homescreenAreaBounds, appDrawerDrop}}>
                    <HomescreenNavigator/>
                    <AppDrawer/>
                    <DragPreviewOverlay/>
                </HomescreenDataProvider>
                : <Text variant={"headlineMedium"}>Loading...</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    grid: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    }
});
