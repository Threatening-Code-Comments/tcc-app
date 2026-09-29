import {inArray} from "drizzle-orm";
import {db} from "@db/database";
import {hsFolders, hsItems, tileEvents, tiles} from "@db/schema";
import {HomescreenDiff} from "@homescreen/persistence/diff";

/**
 * Applies one homescreen diff in a single transaction (expo-sqlite transactions in drizzle
 * are synchronous, hence .run() everywhere). Upserts first — tiles, then folders parents
 * first, then items — and deletes after, children before parents, so it also holds up once
 * foreign keys get switched on. A deleted tile takes its events along (tile_events has no
 * cascade). Throws if anything fails; the transaction is rolled back then.
 */
export function writeHomescreenDiff(diff: HomescreenDiff) {
    db().transaction(tx => {
        for (const row of diff.tiles.upserts) {
            const {id, ...rest} = row
            tx.insert(tiles).values(row).onConflictDoUpdate({target: tiles.id, set: rest}).run()
        }
        for (const row of diff.folders.upserts) {
            const {id, ...rest} = row
            tx.insert(hsFolders).values(row).onConflictDoUpdate({target: hsFolders.id, set: rest}).run()
        }
        for (const row of diff.items.upserts) {
            const {id, ...rest} = row
            tx.insert(hsItems).values(row).onConflictDoUpdate({target: hsItems.id, set: rest}).run()
        }

        if (diff.items.deletes.length > 0)
            tx.delete(hsItems).where(inArray(hsItems.id, diff.items.deletes)).run()
        //already ordered children first by diffSnapshots — one by one to keep that order
        for (const id of diff.folders.deletes)
            tx.delete(hsFolders).where(inArray(hsFolders.id, [id])).run()
        if (diff.tiles.deletes.length > 0) {
            tx.delete(tileEvents).where(inArray(tileEvents.tileId, diff.tiles.deletes)).run()
            tx.delete(tiles).where(inArray(tiles.id, diff.tiles.deletes)).run()
        }
    })
}
