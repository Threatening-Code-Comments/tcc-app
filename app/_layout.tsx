import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Slot, useNavigation, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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