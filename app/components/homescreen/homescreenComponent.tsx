import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {HomeScreenHandler} from './homescreenHandler';
import HomescreenHandlerNew from './homescreenHandler2'
import {AppDrawer} from "@components/homescreen/AppDrawer/AppDrawer";
import HomescreenHandler3 from "@components/homescreen/3_homescreenHandler";

export const HomescreenComponent = () => {
    const items = [
        {id: 2, x: 1, y: 0, width: 2, height: 1},
        {id: 1, x: 0, y: 0, width: 1, height: 1}, // width und height als Einheiten

        {id: 3, x: 2, y: 1, width: 1, height: 1},
        // Weitere Widgets ...
    ]

    const [appDrawerOpen, setAppDrawerOpen] = useState(false);

    return (
        <View style={styles.grid}>
            {/* <HomeScreenHandler items={items} /> */}
            {/*<HomescreenHandlerNew items={items}/>*/}
            <HomescreenHandler3 items={items.map((i)=>({
                layout: {x: i.x, y: i.y, width: i.width, height: i.height},
                itemId: i.id,
                parentId: undefined
            }))} />
            <AppDrawer items={items} isOpen={appDrawerOpen} onToggle={() => null} onDragEnd={() => null} onDrop={() => null}/>
        </View>
    )
}

const styles = StyleSheet.create({
    grid: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f2f2f2',
        alignItems: 'center',
        justifyContent: 'center'
    }
});