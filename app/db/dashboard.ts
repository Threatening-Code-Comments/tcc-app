import { DashboardElementType, DashboardEntry, DashboardSetting, ElementType, isRoutineOnPage, isTile } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

export const getDashboardEntries = (callback: ResultCallback<DashboardEntry>) => {
    const query = "SELECT * FROM dashboard"

    db()
        .getAllAsync<DashboardEntry>(query)
        .then((result) => {
            callback(null, result.map(entry => entry['rows']).flat())
        })
        .catch((error) => {
            callback(error, [])
        })
}

export const getDashboardSettings = (callback: ResultCallback<DashboardSetting>) => {
    db()
        .getAllAsync<DashboardSetting>("SELECT * FROM dashboardSettings")
        .then((result) => {
            callback(null, result.map(entry => entry['rows']).flat())
        })
        .catch((error) => {
            callback(error, [])
        })
}

export const checkIfElementOnDashboard = async <TElement extends ElementType>(element: TElement,): Promise<boolean> => {
    const elementType: DashboardElementType = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";

    const result = await db()
        .getFirstAsync("SELECT * FROM dashboard WHERE elementId = ? AND elementType = ?", [element.id, elementType])

    return result['rows'].length > 0
}

export const addElementToDashboard = <TElement extends ElementType>(element: TElement, callback: InsertCallback) => {
    const elementType: DashboardElementType = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";
    const id = element.id
    db()
        .runAsync(`INSERT OR IGNORE INTO dashboard (elementId, elementType, posX, posY, spanX, spanY) VALUES(?, ?, ?, ?, ?, ?)`, [id, elementType, 0, 0, 0, 0])
        .then((result) => callback(null, [result]))
        .catch((error) => callback(error, []))
}

export const removeElementFromDashboard = <TElement extends ElementType>(element: TElement, callback: InsertCallback) => {
    const elementType: DashboardElementType = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";
    const id = element.id

    db()
        .runAsync("DELETE FROM dashboard WHERE elementId = ? AND elementType = ?", [id, elementType])
        .then((result) => callback(null, [result]))
        .catch((error) => callback(error, []))
}