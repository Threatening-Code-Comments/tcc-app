import { InsertPage, Page } from "../constants/DbTypes"
import { ResultCallback, db } from "./database"

export const getPages = (callback: ResultCallback<Page>) => {
    db().exec(
        [{ sql: 'SELECT * FROM pages', args: [] },],
        true,
        (error, resultSet) => callback(error, resultSet.map(entry => entry['rows']).flat())
    )
}

export const getPageById = (id: number, callback: ResultCallback<Page>) => {
    db().exec(
        [{ sql: 'SELECT * FROM pages WHERE id = ?', args: [id] }],
        true,
        (err, res) => //callback(err, res.flatMap(entry=>entry['rows']))

            callback(err, res.map(entry => entry['rows']).flat())
    )
}

export const insertPages = (pages: Array<InsertPage>) => {
    db().transaction(t => {
        pages.map(page =>
            t.executeSql('INSERT INTO pages (name) VALUES (?)', [page.name])
        )
    })
}