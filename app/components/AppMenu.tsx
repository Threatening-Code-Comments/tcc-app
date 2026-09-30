import React, {useEffect, useState} from 'react'
import {Alert, BackHandler, Pressable, StyleSheet, useWindowDimensions} from 'react-native'
import {Drawer, IconButton, Portal, Text, useTheme} from 'react-native-paper'
import Animated, {runOnJS, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {exportDbFile, importDbFile, saveDbFileToDownloads} from '@db/backup'

const ANIMATION_MS = 220
const MAX_PANEL_WIDTH = 320

//an import replaces the whole database (library, events, homescreen) — ask first
const confirmImport = async () => {
    Alert.alert(
        'Backup importieren?',
        'Alle aktuellen Daten werden durch das Backup ersetzt. Vorher ggf. selbst ein Backup speichern.',
        [
            {text: 'Abbrechen', style: 'cancel'},
            {text: 'Datei wählen', style: 'destructive', onPress: () => { importDbFile().catch(e => console.error('import failed', e)) }},
        ]
    )
}

/**
 * The burger button top left and the sidebar it opens — home for app-wide actions that
 * don't belong on the homescreen itself (backup for now, settings later). The sidebar
 * slides in from the left over a dimmed backdrop; tapping the backdrop or Android's back
 * button closes it. Entries close it before they run, so the system dialogs they open
 * (file picker, share sheet) aren't stacked on top of it.
 */
export const AppMenu = () => {
    const {colors} = useTheme()
    const insets = useSafeAreaInsets()
    const {width: screenWidth} = useWindowDimensions()
    const panelWidth = Math.min(screenWidth * 0.8, MAX_PANEL_WIDTH)

    const [open, setOpen] = useState(false)
    //stays true while the close animation runs, so the panel can slide out before unmounting
    const [mounted, setMounted] = useState(false)
    const progress = useSharedValue(0)

    useEffect(() => {
        if (open) {
            setMounted(true)
            progress.value = withTiming(1, {duration: ANIMATION_MS})
        } else if (mounted) {
            progress.value = withTiming(0, {duration: ANIMATION_MS}, done => {
                if (done) runOnJS(setMounted)(false)
            })
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            setOpen(false)
            return true
        })
        return () => sub.remove()
    }, [open])

    const backdropStyle = useAnimatedStyle(() => ({opacity: progress.value * 0.5}))
    const panelStyle = useAnimatedStyle(() => ({transform: [{translateX: (progress.value - 1) * panelWidth}]}))

    const run = (action: () => Promise<void>) => () => {
        setOpen(false)
        action().catch(e => console.error('menu action failed', e))
    }

    return (
        <>
            <IconButton icon="menu" size={28} onPress={() => setOpen(true)} accessibilityLabel="Menü"/>
            {mounted && (
                <Portal>
                    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
                        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Menü schließen"/>
                    </Animated.View>
                    <Animated.View style={[styles.panel, panelStyle, {
                        width: panelWidth,
                        backgroundColor: colors.elevation.level1,
                        paddingTop: insets.top + 12,
                        paddingBottom: insets.bottom,
                    }]}>
                        <Text variant="titleLarge" style={styles.title}>Menü</Text>
                        <Drawer.Section title="Backup" showDivider={false}>
                            <Drawer.Item icon="content-save" label="Backup speichern" onPress={run(saveDbFileToDownloads)}/>
                            <Drawer.Item icon="share-variant" label="Backup teilen" onPress={run(exportDbFile)}/>
                            <Drawer.Item icon="database-import" label="Backup importieren" onPress={run(confirmImport)}/>
                        </Drawer.Section>
                    </Animated.View>
                </Portal>
            )}
        </>
    )
}

const styles = StyleSheet.create({
    backdrop: {
        backgroundColor: 'black',
    },
    panel: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
    },
    title: {
        paddingHorizontal: 28,
        paddingBottom: 12,
    },
})
