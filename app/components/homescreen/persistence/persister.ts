import {HomescreenSnapshot} from "@homescreen/persistence/rows";
import {diffSnapshots, HomescreenDiff, isEmptyDiff} from "@homescreen/persistence/diff";

export const PERSIST_DEBOUNCE_MS = 500

type Options = {
    //what's in the database right now (i.e. what was just loaded)
    initial: HomescreenSnapshot,
    //the current in-memory state, read when a flush actually happens
    read: () => HomescreenSnapshot,
    //applies one diff atomically; throwing means nothing was written
    write: (diff: HomescreenDiff) => void,
    debounceMs?: number,
    onError?: (error: unknown) => void,
}

/**
 * Mirrors the in-memory homescreen into the database: markDirty() after every change,
 * and the diff against the last successful write goes out once things have been quiet for
 * debounceMs. flush() writes right away (app going to the background, unmount). A failed
 * write keeps the old baseline, so the next flush retries the same changes.
 */
export function createHomescreenPersister({initial, read, write, debounceMs = PERSIST_DEBOUNCE_MS, onError = console.error}: Options) {
    let persisted = initial
    let timer: ReturnType<typeof setTimeout> | undefined

    const flush = () => {
        if (timer !== undefined) clearTimeout(timer)
        timer = undefined
        const current = read()
        const diff = diffSnapshots(persisted, current)
        if (isEmptyDiff(diff)) return
        try {
            write(diff)
            persisted = current
        } catch (e) {
            onError(e)
        }
    }

    const markDirty = () => {
        if (timer !== undefined) clearTimeout(timer)
        timer = setTimeout(flush, debounceMs)
    }

    //flushes what's pending and stops the timer — for unmount
    const dispose = () => {
        if (timer !== undefined) flush()
    }

    return {markDirty, flush, dispose}
}
