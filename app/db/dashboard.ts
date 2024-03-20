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

export const addElementToDashboard = <TElement extends ElementType> (element: TElement, callback: InsertCallback) => {
    const elementType: DashboardElementType = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";
    const id = element.id
    db().exec(
        [{ sql: 'INSERT INTO dashboard VALUES(?, ?, ?, ?, ?, ?)', args: [id, elementType, 0, 0, 0, 0] }],
        false,
        (error, resultSet) => callback(error, resultSet)
    )
}