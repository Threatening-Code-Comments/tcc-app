import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useNavigation, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './constants/global';
import { initDb } from './db/database';

export default function RootLayout() {
    const router = useRouter()
    const navigation = useNavigation()

    const onBackButton = () => {
        (navigation.canGoBack()) ? router.back() : ""
    }

    useEffect(() => {
        initDb()
    }, [])

    return (
        <SafeAreaProvider>
            <View style={styles.background}>
                <SafeAreaView>
                    <ThemeProvider value={DarkTheme}>
                        <View style={styles.rootView}>
                            <Pressable onPress={onBackButton} style={{ alignSelf: 'flex-start', padding: 10, paddingLeft: 25 }}>
                                <FontAwesome name='arrow-left' size={40} color="white" />
                            </Pressable>
                            <View style={styles.slotView}>
                                <Slot />
                            </View>
                        </View>
                    </ThemeProvider>
                </SafeAreaView>
            </View>
        </SafeAreaProvider>
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