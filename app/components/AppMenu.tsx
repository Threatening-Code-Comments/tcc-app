import React, {useState} from 'react'
import {Alert} from 'react-native'
import {Divider, IconButton, Menu} from 'react-native-paper'
import {exportDbFile, importDbFile, saveDbFileToDownloads} from '@db/backup'

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
 * The burger menu top left — home for app-wide actions that don't belong on the homescreen
 * itself (backup for now, settings later). Each entry closes the menu before it runs, so
 * the system dialogs it opens (file picker, share sheet) aren't stacked on top of it.
 */
export const AppMenu = () => {
    const [open, setOpen] = useState(false)

    const run = (action: () => Promise<void>) => () => {
        setOpen(false)
        action().catch(e => console.error('menu action failed', e))
    }

    return (
        <Menu
            visible={open}
            onDismiss={() => setOpen(false)}
            anchor={<IconButton icon="menu" size={28} onPress={() => setOpen(true)} accessibilityLabel="Menü"/>}
        >
            <Menu.Item leadingIcon="content-save" title="Backup speichern" onPress={run(saveDbFileToDownloads)}/>
            <Menu.Item leadingIcon="share-variant" title="Backup teilen" onPress={run(exportDbFile)}/>
            <Divider/>
            <Menu.Item leadingIcon="database-import" title="Backup importieren" onPress={run(confirmImport)}/>
        </Menu>
    )
}
