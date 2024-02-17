import { ThemeProvider, DarkTheme, DefaultTheme, useTheme } from '@react-navigation/native';

import { Slot, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons'
import { initDb } from './db/database';

export default function RootLayout() {
    const router = useRouter()

    const onBackButton = () => {
        (router.canGoBack()) ? router.back() : ""
    }

    useEffect(() => {
        initDb()
    }, [])

    return (
        <SafeAreaProvider>
            <SafeAreaView>
                <ThemeProvider value={DarkTheme}>
                    <Slot />
                    <Pressable onPress={onBackButton} style={{ alignSelf: 'center' }}>
                        <Ionicons name='md-backspace' size={50} color="black" />
                    </Pressable>
                </ThemeProvider>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
