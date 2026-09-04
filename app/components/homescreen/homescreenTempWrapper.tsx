import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTheme} from 'react-native-paper';
import {AppDrawer} from "@components/homescreen/AppDrawer/AppDrawer";
import {HomescreenNavigator} from "@components/homescreen/navigator";

export const HomescreenTempWrapper = () => {
    const {colors} = useTheme();
    const items = [
        {id: 2, x: 1, y: 0, width: 2, height: 1},
        {id: 1, x: 0, y: 0, width: 1, height: 1}, // width und height als Einheiten

        {id: 3, x: 2, y: 1, width: 1, height: 1},
        // Weitere Widgets ...
    ]

    const [appDrawerOpen, setAppDrawerOpen] = useState(false);

    return (
        <View style={[styles.grid, {backgroundColor: colors.background}]}>
            <HomescreenNavigator/>

            <AppDrawer items={items} isOpen={appDrawerOpen} onToggle={() => null} onDragEnd={() => null}
                       onDrop={() => null}/>
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