import { and, eq, inArray } from "drizzle-orm"
import { ElementTypeNames, InsertPage, Page } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { dashboard, pages, routines, tileEvents, tiles } from "./schema"

export const getPages = (callback: ResultCallback<Page>) => {
    db()
        .select()
        .from(pages)
        .then(
            pages => callback(null, pages),
            err => callback(err, [])
        )
}

export const getPageByIdStmt = (ids: number[]) => db().query.pages.findMany({
    where(fields, operators) {
        return operators.inArray(fields.id, ids)
    }, with: {
        routines: true
    }
})

export const getPageById = (id: number, callback: ResultCallback<Page>) => {
    db()
        .select()
        .from(pages)
        .where(eq(pages.id, id))
        .then(
            pages => callback(null, pages),
            err => callback(err, [])
        )

    // db()
    //     .getAllAsync<Page>('SELECT * FROM pages WHERE id = ?', [id])
    //     .then(pages => callback(null, pages))
}

export const getPagesFromIds = (ids: number[], callback: ResultCallback<Page>) => {
    if (ids.length == 0) {
        callback(null, [])
        return
    }

    db()
        .select()
        .from(pages)
        .where(inArray(pages.id, ids))
        .then(
            pages => callback(null, pages),
            err => callback(err, [])
        )


    // const query = `SELECT * 
    //         FROM pages 
    //         WHERE id IN (` + ids.map(() => "?").join(",") + ");"

    // db()
    //     .getAllAsync<Page>(query, ids)
    //     .then(pages => callback(null, pages))
}

export const insertPages = (pagesP: Array<InsertPage>, callback: InsertCallback) => {
    db()
        .insert(pages)
        .values(pagesP)
        .then(
            (r) => callback(null, [r]),
            (e) => callback(e, [])
        )


    // db()
    //     .withTransactionAsync(async () => {
    //         const res = []

    //         pagesP.map(async page => {
    //             res.push(
    //                 db().runAsync('INSERT INTO pages (name) VALUES (?)', [page.name])
    //             )
    //         })

    //         Promise.all(res)
    //             .then(res => callback(null, res))
    //     })
}

export const deleteChildrenOfPage = async (pageId: number) => {
    const routinesFromDb = await db().query.routines.findMany({
        with: { tiles: { with: { events: true } } }, where(fields, operators) {
            return operators.eq(fields.rootPageId, pageId)
        },
    })

    const routineIds = routinesFromDb.map(r => r.id)
    const tileIds = routinesFromDb.map(r => r.tiles.map(t => t.id)).flat()

    await db().delete(routines).where(inArray(routines.id, routineIds))
    await db().delete(tiles).where(inArray(tiles.id, tileIds))
    await db().delete(tileEvents).where(inArray(tileEvents.tileId, tileIds))
    await db().delete(dashboard).where(
        and(
            eq(dashboard.elementType, ElementTypeNames.Page),
            eq(dashboard.elementId, pageId)
        ))
}
export const deletePage = (page: Page, callback: InsertCallback) => {
    deleteChildrenOfPage(page.id)
    db()
        .delete(pages)
        .where(eq(pages.id, page.id))
        .then(
            res => callback(null, [res]),
            err => callback(err, [])
        )

    // db()
    //     .runAsync('DELETE FROM pages WHERE id = ?', [page.id])
    //     .then(res => callback(null, [res]))
}

export const updatePage = (page: Page, callback: InsertCallback) => {
    db()
        .update(pages)
        .set({ name: page.name, color: page.color })
        .where(eq(pages.id, page.id))
        .then(
            res => callback(null, [res]),
            err => callback(err, [])
        )

    // db()
    //     .runAsync('UPDATE pages SET name = ? WHERE id = ?', [page.name, page.id])
    //     .then(res => callback(null, [res]))
}