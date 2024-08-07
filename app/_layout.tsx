import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useNavigation, usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './constants/global';
import { theme } from './constants/themes';
import { initDb } from './db/database';

export default function RootLayout() {
    const router = useRouter()
    const navigation = useNavigation()
    const location = usePathname();

    const onBackButton = () => {
        (navigation.canGoBack()) ? router.back() : ""
    }

    useEffect(() => {
        console.log("initdb s")
        initDb()
        console.log("initdb e")
    }, [])

    return (
        <ThemeProvider value={DarkTheme}>
            <PaperProvider theme={theme}>
                <View style={styles.background}>
                    <SafeAreaView>
                        <View style={styles.rootView}>
                            <GestureHandlerRootView style={{ flex: 1 }}>
                                {location !== "/" && (
                                    <Pressable onPress={onBackButton} style={{ alignSelf: 'flex-start', padding: 10, paddingLeft: 25 }}>
                                        <FontAwesome name='arrow-left' size={40} color="white" />
                                    </Pressable>
                                )}
                                <View style={styles.slotView}>
                                    <Slot />
                                </View>
                            </GestureHandlerRootView>
                        </View>
                    </SafeAreaView>
                </View>
            </PaperProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    background: {
        backgroundColor: colors.background,
    },
    rootView: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        // backgroundColor: background,
        // color: "white"
    },
    slotView: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        flexGrow: 1,
    }
})