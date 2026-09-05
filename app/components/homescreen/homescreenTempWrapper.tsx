import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Text, useTheme} from 'react-native-paper';
import {AppDrawer} from "@components/homescreen/AppDrawer/AppDrawer";
import {HomescreenNavigator} from "@components/homescreen/navigator";
import {useHomescreenLibraryData} from "@components/homescreen/hooks/useHomescreenLibraryData";
import {HomescreenDataProvider} from "@components/homescreen/homescreen-data-context";

export const HomescreenTempWrapper = () => {
    const {colors} = useTheme();
    const {folders, tiles, dataLoaded} = useHomescreenLibraryData()

    return (
        <View style={[styles.grid, {backgroundColor: colors.background}]}>
            {dataLoaded
                ? <HomescreenDataProvider value={{folders, tiles}}>
                    <HomescreenNavigator/>
                    <AppDrawer/>
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
