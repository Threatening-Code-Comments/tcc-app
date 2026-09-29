import {useEffect, useRef} from "react";
import {AppState} from "react-native";
import {runOnJS, SharedValue, useAnimatedReaction} from "react-native-reanimated";
import {HS3Folder, Tile} from "@homescreen/types";
import {HomescreenSnapshot, toSnapshot} from "@homescreen/persistence/rows";
import {createHomescreenPersister} from "@homescreen/persistence/persister";
import {writeHomescreenDiff} from "@homescreen/persistence/writer";

/**
 * The one writer of the homescreen: watches folders + tiles and mirrors every change into
 * the database (debounced, see createHomescreenPersister). crud/ stays database-free.
 * `loaded` is exactly what came out of the database — the baseline. It's taken at load time
 * rather than read here, so changes made right after loading (e.g. the routine-folder sync)
 * still count as changes and get written. Writes right away when the app leaves the
 * foreground, so a kill in the background loses nothing.
 */
export function usePersistHomescreen(folders: SharedValue<HS3Folder[]>, tiles: SharedValue<Tile[]>, loaded: HomescreenSnapshot | undefined) {
    const persister = useRef<ReturnType<typeof createHomescreenPersister> | undefined>(undefined)

    useEffect(() => {
        if (!loaded) return
        const p = createHomescreenPersister({
            initial: loaded,
            read: () => toSnapshot(folders.value, tiles.value),
            write: writeHomescreenDiff,
        })
        persister.current = p
        p.markDirty()

        const subscription = AppState.addEventListener("change", state => {
            if (state !== "active") p.flush()
        })
        return () => {
            subscription.remove()
            p.dispose()
            persister.current = undefined
        }
    }, [loaded])

    const markDirty = () => persister.current?.markDirty()
    useAnimatedReaction(
        () => ({folders: folders.value, tiles: tiles.value}),
        (current, previous) => {
            if (previous !== null && current !== previous) runOnJS(markDirty)()
        }, [folders, tiles]
    )
}
