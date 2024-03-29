import { Query } from "expo-sqlite"
import { InsertPage, Page } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

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
        (err, res) => callback(err, res.map(entry => entry['rows']).flat())
    )
}

export const getPagesFromIds = (ids: number[], callback: ResultCallback<Page>) => {
    const query = `SELECT * 
            FROM pages 
            WHERE id IN (` + ids.map(()=>"?").join(",") + ");"
        
    db().exec(
        [{sql: query, args: ids}],
        true,
        (err, res) => callback(err, res.map(entry => entry['rows']).flat())
    )
}

export const insertPages = (pages: Array<InsertPage>, callback: InsertCallback) => {
    const statements: Query[] = []
    pages.map(page =>
        statements.push({ sql: 'INSERT INTO pages (name) VALUES (?)', args: [page.name] })
    )

    db().exec(statements, false, callback)
}

export const deletePage = (page: Page, callback: InsertCallback) => {
    db().exec(
        [{ sql: 'DELETE FROM pages WHERE id = ?', args: [page.id] }],
        false,
        callback
    )
}

export const updatePage = (page: Page, callback: InsertCallback) => {
    db().exec(
        [{ sql: 'UPDATE pages SET name = ? WHERE id = ?', args: [page.name, page.id] }],
        false,
        callback
    )
}