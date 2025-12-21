//Link for checking new ones:
//https://pictogrammers.com/library/mdi/
export const iconNames = {
    edit: "file-edit-outline",
    delete: "delete",
    add: "plus",
    db: "database",
    starCheck: 'star-check',
    // starRemoved: 'star-remove-outline',
    starOutline: 'star-outline',
    list: 'view-list',
    text: 'text',
    numeric: 'numeric',
    save: 'content-save',
    clockOutline: 'clock-outline',
    arrowUp: 'arrow-up',
    arrowDown: 'arrow-down',
    close: 'close',
    refresh: 'restart',
    createFolder: 'folder-multiple-plus',
    moveToFolder: 'folder-move',
} as const

// valueof => T[keyof T]
export type IconName =
// (typeof iconNames)[keyof typeof iconNames]
//FontAwesome.glyphMap
    keyof typeof iconNames