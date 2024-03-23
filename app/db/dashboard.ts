import { DashboardElementType, DashboardEntry, DashboardSetting, ElementType, isRoutineOnPage, isTile } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

export const getDashboardEntries = (callback: ResultCallback<DashboardEntry>) => {
    db().exec(
        [{ sql: 'SELECT * FROM dashboard', args: [] },],
        true,
        (error, resultSet) => callback(error, resultSet.map(entry => entry['rows']).flat())
    )
}

export const getDashboardSettings = (callback: ResultCallback<DashboardSetting>) => {
    db().exec(
        [{ sql: 'SELECT * FROM dashboardSettings', args: [] },],
        true,
        (error, resultSet) => callback(error, resultSet.map(entry => entry['rows']).flat())
    )
}

export const checkIfElementOnDashboard = async <TElement extends ElementType>(element: TElement,): Promise<boolean> => {
    const elementType: DashboardElementType = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";

    const result = await db().execAsync(
        [{ sql: 'SELECT * FROM dashboard WHERE elementId = ? AND elementType = ?', args: [element.id, elementType] }],
        true,
    )

    return result[0]['rows'].length > 0
}

export const addElementToDashboard = <TElement extends ElementType>(element: TElement, callback: InsertCallback) => {
    const elementType: DashboardElementType = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";
    const id = element.id
    db().exec(
        [{ sql: `INSERT OR IGNORE INTO dashboard (elementId, elementType, posX, posY, spanX, spanY) VALUES(?, ?, ?, ?, ?, ?)`, args: [id, elementType, 0, 0, 0, 0] }],
        false,
        (error, resultSet) => callback(error, resultSet)
    )
}

export const removeElementFromDashboard = <TElement extends ElementType>(element: TElement, callback: InsertCallback) => {
    const elementType: DashboardElementType = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";
    const id = element.id

    db().exec(
        [{ sql: 'DELETE FROM dashboard WHERE elementId = ? AND elementType = ?', args: [id, elementType] }],
        false,
        (error, resultSet) => callback(error, resultSet)
    )
}