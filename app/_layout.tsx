import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Slot, useNavigation, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { initDb } from './db/database';
import { colors } from './constants/global';

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
                            <View style={styles.slotView}>
                                <Slot />
                            </View>
                            <Pressable onPress={onBackButton} style={{ alignSelf: 'center' }}>
                                <Ionicons name='md-backspace' size={50} color="white" />
                            </Pressable>
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