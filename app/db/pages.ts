import { InsertPage, Page } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

export const getPages = (callback: ResultCallback<Page>) => {
    db()
        .getAllAsync<Page>('SELECT * FROM pages')
        .then(pages => callback(null, pages))
        .catch(err => callback(err, []))
}

export const getPageById = (id: number, callback: ResultCallback<Page>) => {
    db()
        .getAllAsync<Page>('SELECT * FROM pages WHERE id = ?', [id])
        .then(pages => callback(null, pages))
}

export const getPagesFromIds = (ids: number[], callback: ResultCallback<Page>) => {
    const query = `SELECT * 
            FROM pages 
            WHERE id IN (` + ids.map(() => "?").join(",") + ");"

    db()
        .getAllAsync<Page>(query, ids)
        .then(pages => callback(null, pages))
}

export const insertPages = (pages: Array<InsertPage>, callback: InsertCallback) => {
    db()
        .withTransactionAsync(async () => {
            const res = []

            pages.map(async page => {
                res.push(
                    await db().runAsync('INSERT INTO pages (name) VALUES (?)', [page.name])
                )
            })

            callback(null, res)
        })
}

export const deletePage = (page: Page, callback: InsertCallback) => {
    db()
        .runAsync('DELETE FROM pages WHERE id = ?', [page.id])
        .then(res => callback(null, [res]))
}

export const updatePage = (page: Page, callback: InsertCallback) => {
    db()
        .runAsync('UPDATE pages SET name = ? WHERE id = ?', [page.name, page.id])
        .then(res => callback(null, [res]))
}