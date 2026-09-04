import * as DocumentPicker from 'expo-document-picker'
import { File, Paths } from 'expo-file-system'
import { StorageAccessFramework } from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import * as Updates from 'expo-updates'
import { Platform, ToastAndroid } from 'react-native'
import { dbName } from '../constants/global'

const SQLITE_DIR = 'SQLite'
const SQLITE_MAGIC = 'SQLite format 3\0'

const dbFile = () => new File(Paths.document, SQLITE_DIR, dbName)

const stamp = () => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}`
}

const toast = (msg: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.LONG)
    else console.log(msg)
}

/**
 * Kopiert die SQLite-Datei in den Cache-Ordner und öffnet das System-Share-Sheet.
 * Der Nutzer kann das Backup dann an Google Drive / Mail / lokal speichern senden.
 */
export const exportDbFile = async () => {
    const src = dbFile()
    if (!src.exists) {
        toast('Keine Datenbank zum Exportieren gefunden.')
        return
    }

    const outName = `tcc-backup-${stamp()}.db`
    const dst = new File(Paths.cache, outName)
    if (dst.exists) dst.delete()
    src.copy(dst)

    if (!(await Sharing.isAvailableAsync())) {
        toast(`Backup gespeichert: ${dst.uri}`)
        return
    }
    await Sharing.shareAsync(dst.uri, {
        mimeType: 'application/vnd.sqlite3',
        dialogTitle: 'TCC-Backup teilen',
        UTI: 'public.database',
    })
}

/**
 * Speichert die DB direkt in einem vom Nutzer gewählten Ordner (Storage Access
 * Framework). Auf iOS gibt's kein SAF — dort fallen wir auf das Share-Sheet
 * zurück, in dem "In Dateien speichern" denselben Effekt hat.
 */
export const saveDbFileToDownloads = async () => {
    const src = dbFile()
    if (!src.exists) {
        toast('Keine Datenbank zum Exportieren gefunden.')
        return
    }
    const outName = `tcc-backup-${stamp()}.db`

    if (Platform.OS !== 'android') {
        return exportDbFile()
    }

    const perms = await StorageAccessFramework.requestDirectoryPermissionsAsync()
    if (!perms.granted) return

    const fileUri = await StorageAccessFramework.createFileAsync(
        perms.directoryUri,
        outName,
        'application/vnd.sqlite3',
    )
    await StorageAccessFramework.writeAsStringAsync(fileUri, src.base64Sync(), {
        encoding: 'base64',
    })
    toast(`Backup gespeichert: ${outName}`)
}

/**
 * Lässt den Nutzer eine .db-Datei wählen, validiert den SQLite-Header und
 * ersetzt die laufende DB. Anschließend Reload (DB-Handles greifen sonst auf
 * das alte File).
 */
export const importDbFile = async () => {
    const pick = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: ['application/vnd.sqlite3', 'application/octet-stream', '*/*'],
    })
    if (pick.canceled) return

    const picked = new File(pick.assets[0].uri)
    const head = picked.bytes().slice(0, SQLITE_MAGIC.length)
    const headStr = String.fromCharCode(...head)
    if (headStr !== SQLITE_MAGIC) {
        toast('Datei ist keine gültige SQLite-Datenbank.')
        return
    }

    const target = dbFile()
    if (target.exists) target.delete()
    picked.copy(target)

    toast('Backup importiert — App wird neu geladen.')
    await Updates.reloadAsync()
}
