import { and, eq } from "drizzle-orm"
import { ElementTypeNames, DashboardEntry, DashboardSetting, ElementType, isRoutineOnPage, isTile, getElementTypeName } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { dashboard, dashboardSettings } from "./schema"

export const getDashboardEntries = (callback: ResultCallback<DashboardEntry>) => {
    db().query.dashboard.findMany({
        with: {
            element: true
        }
    }).then(
        r => callback(null, r),
        e => callback(e, [])
    )

    // const query = "SELECT * FROM dashboard"

    // db()
    //     .getAllAsync<DashboardEntry>(query)
    //     .then((result) => {
    //         callback(null, result)
    //     })
    //     .catch((error) => {
    //         callback(error, [])
    //     })
}

export const getDashboardSettings = (callback: ResultCallback<DashboardSetting>) => {
    db().query.dashboardSettings.findMany({
        with: {
            element: true
        }
    })
        .then(
            results => callback(null, results),
            err => callback(err, [])
        )

    // db()
    //     .getAllAsync<DashboardSetting>("SELECT * FROM dashboardSettings")
    //     .then((result) => {
    //         callback(null, result)
    //     })
    //     .catch((error) => {
    //         callback(error, [])
    //     })
}

export const checkIfElementOnDashboard = async <TElement extends ElementType>(element: TElement,): Promise<boolean> => {
    const res = await db()
        .select()
        .from(dashboard)
        .where(
            and(
                eq(dashboard.elementId, element.id),
                eq(dashboard.elementType, getElementTypeName(element))
            )
        )
        .limit(1)
    return res.length > 0

    // const elementType: DashboardElementType = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";

    // const result = await db()
    //     .getFirstAsync<DashboardEntry>("SELECT * FROM dashboard WHERE elementId = ? AND elementType = ?", [element.id, elementType])

    // return !!result //!!true
}

export const addElementToDashboard = <TElement extends ElementType>(element: TElement, callback: InsertCallback) => {
    db().insert(dashboard).values({ elementId: element.id, elementType: getElementTypeName(element), posX: 0, posY: 0, spanX: 0, spanY: 0 })
        .then(
            res => callback(null, [res]),
            err => callback(err, [])
        ).finally(() => {
            db().query.dashboard.findMany({}).then(r => console.log("added, new results:", r))
        })

    // db()
    //     .runAsync(`INSERT OR IGNORE INTO dashboard (elementId, elementType, posX, posY, spanX, spanY) VALUES(?, ?, ?, ?, ?, ?)`, [id, elementType, 0, 0, 0, 0])
    //     .then((result) => callback(null, [result]))
    //     .catch((error) => callback(error, []))
}

export const removeElementFromDashboard = <TElement extends ElementType>(element: TElement, callback: InsertCallback) => {
    db()
        .delete(dashboard)
        .where(
            and(
                eq(dashboard.elementId, element.id),
                eq(dashboard.elementType, getElementTypeName(element))
            )
        )
        .then(
            res => callback(null, [res]),
            err => callback(err, [])
        )

    // const elementType: ElementTypeNames = isTile(element) ? "Tile" : isRoutineOnPage(element) ? "Routine" : "Page";
    // const id = element.id

    // db()
    //     .runAsync("DELETE FROM dashboard WHERE elementId = ? AND elementType = ?", [id, elementType])
    //     .then((result) => callback(null, [result]))
    //     .catch((error) => callback(error, []))
}